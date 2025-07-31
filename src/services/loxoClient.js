// src/services/loxoClient.js
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();
import config from '../config/index.js';

const LOXO_API_KEY = config.loxoApiKey || process.env.LOXO_API_KEY; // Ensure fallback to env variable
const LOXO_SLUG = config.loxoSlug || process.env.LOXO_SLUG; // e.g., your agency slug
const LOXO_DOMAIN = config.loxoDomain || process.env.LOXO_DOMAIN || 'app.loxo.co';

const loxoClient = axios.create({
  baseURL: `https://${LOXO_DOMAIN}/api/${LOXO_SLUG}`,
  headers: {
    Authorization: `Bearer ${LOXO_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

export default loxoClient;
