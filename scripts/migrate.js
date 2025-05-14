// This script runs the database migrations
require('dotenv').config();
require('ts-node/register');
require('../src/db/migrate').default();
