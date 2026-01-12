-- Migration: Change image_url column from VARCHAR(255) to TEXT
-- This is required to store base64 encoded images which are typically 50KB-2MB in size
-- Run this SQL script manually in your PostgreSQL database

ALTER TABLE mini_job_cards
ALTER COLUMN image_url TYPE TEXT;

-- Verify the change
-- SELECT column_name, data_type, character_maximum_length
-- FROM information_schema.columns
-- WHERE table_name = 'mini_job_cards' AND column_name = 'image_url';
