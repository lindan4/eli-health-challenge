#!/bin/bash
set -e

# Create the test database
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE eli_test_strips_test;
EOSQL

# Apply the schema to the main database
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE TABLE test_strip_submissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        qr_code VARCHAR(100),
        qr_code_valid BOOLEAN,
        quality VARCHAR(50),
        original_image_path TEXT NOT NULL,
        thumbnail_path TEXT,
        image_size INTEGER,
        image_dimensions VARCHAR(50),
        status VARCHAR(50) NOT NULL,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX idx_qr_code ON test_strip_submissions(qr_code);
    CREATE INDEX idx_created_at ON test_strip_submissions(created_at DESC);
EOSQL

# Apply the same schema to the test database
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "eli_test_strips_test" <<-EOSQL
    CREATE TABLE test_strip_submissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        qr_code VARCHAR(100),
        qr_code_valid BOOLEAN,
        quality VARCHAR(50),
        original_image_path TEXT NOT NULL,
        thumbnail_path TEXT,
        image_size INTEGER,
        image_dimensions VARCHAR(50),
        status VARCHAR(50) NOT NULL,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX idx_qr_code ON test_strip_submissions(qr_code);
    CREATE INDEX idx_created_at ON test_strip_submissions(created_at DESC);
EOSQL