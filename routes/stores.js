const express = require('express');
const Store = require('../models/Store');
const { auth } = require('./auth');

const router = express.Router();

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Resolve a US ZIP code to {lat, lng} via zippopotam.us
async function resolveZipCoords(zip) {
  const res = await fetch(`https://api.zippopotam.us/us/${zip}`);
  if (!res.ok) return null;
  const data = await res.json();
  const place = data.places?.[0];
  if (!place) return null;
  return { lat: parseFloat(place.latitude), lng: parseFloat(place.longitude) };
}

// DB fallback: search our own store collection
async function searchInDb(name, zipLat, zipLng) {
  const stores = await Store.find({ name: new RegExp(name, 'i') });
  const withDist = stores.map((s) => {
    const obj = s.toObject();
    obj.distanceMiles = (zipLat && s.lat && s.lng)
      ? Math.round(haversineDistance(zipLat, zipLng, s.lat, s.lng) * 10) / 10
      : null;
    return obj;
  });
  const nearby = withDist.filter((s) => s.distanceMiles !== null && s.distanceMiles <= 10);
  const results = nearby.length > 0 ? nearby : withDist;
  results.sort((a, b) => (a.distanceMiles ?? Infinity) - (b.distanceMiles ?? Infinity));
  return results.slice(0, 10);
}

// Search stores by zip proximity and name prefix
router.get('/search', async (req, res) => {
  const { zip, name } = req.query;

  if (!zip || !/^\d{5}$/.test(zip)) {
    return res.status(400).json({ message: 'Valid 5-digit ZIP code required' });
  }
  if (!name || name.length < 3) {
    return res.status(400).json({ message: 'Store name must be at least 3 characters' });
  }

  // Step 1 – resolve ZIP → coordinates
  let coords = null;
  try { coords = await resolveZipCoords(zip); } catch { /* non-fatal */ }

  if (!coords) {
    return res.status(400).json({ message: 'Could not resolve ZIP code location' });
  }
  const { lat: zipLat, lng: zipLng } = coords;

  // Step 2 – Google Places Nearby Search (real-world data)
  const googleKey = process.env.GOOGLE_MAPS_API_KEY;

  if (googleKey && googleKey !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
    try {
      // Places API (New) — Text Search
      const placesRes = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': googleKey,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location',
        },
        body: JSON.stringify({
          textQuery: name,
          locationBias: {
            circle: {
              center: { latitude: zipLat, longitude: zipLng },
              radius: 16093, // 10 miles in metres
            },
          },
          maxResultCount: 10,
        }),
      });

      const placesData = await placesRes.json();

      if (placesData.error) {
        console.warn('Google Places API (New) error:', placesData.error.message);
        // Fall through to DB
      } else {
        const results = (placesData.places || []).map((place) => {
          const pLat = place.location.latitude;
          const pLng = place.location.longitude;
          return {
            _id: place.id,
            name: place.displayName.text,
            address: place.formattedAddress,
            zipCode: zip,
            lat: pLat,
            lng: pLng,
            logo: '',
            isMembership: false,
            chainId: place.displayName.text.toLowerCase().replace(/\s+/g, '-'),
            distanceMiles: Math.round(haversineDistance(zipLat, zipLng, pLat, pLng) * 10) / 10,
          };
        });
        return res.json(results);
      }
    } catch (err) {
      console.warn('Google Places API (New) error, falling back to DB:', err.message);
    }
  }

  // Step 3 – DB fallback
  try {
    const results = await searchInDb(name, zipLat, zipLng);
    res.json(results);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all stores
router.get('/', async (req, res) => {
  try {
    const stores = await Store.find();
    res.json(stores);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get store by ID
router.get('/:id', async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }
    res.json(store);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create store (admin only, but for now allowing authenticated users)
router.post('/', auth, async (req, res) => {
  try {
    const store = new Store(req.body);
    await store.save();
    res.status(201).json(store);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update store
router.put('/:id', auth, async (req, res) => {
  try {
    const store = await Store.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }
    res.json(store);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete store
router.delete('/:id', auth, async (req, res) => {
  try {
    const store = await Store.findByIdAndDelete(req.params.id);
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }
    res.json({ message: 'Store deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;