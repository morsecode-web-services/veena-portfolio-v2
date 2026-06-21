-- Migration: Dynamic Backup of all public base tables
-- This script dynamically identifies all BASE TABLEs in the public schema 
-- (excluding any tables already prefixed with 'backup_') and creates snapshot backups.

DO $$
DECLARE
    r RECORD;
    backup_tbl TEXT;
BEGIN
    FOR r IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
          AND table_name NOT LIKE 'backup_%'
    LOOP
        backup_tbl := 'backup_' || r.table_name;
        
        -- Check if the backup table already exists
        IF NOT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
              AND table_name = backup_tbl
        ) THEN
            EXECUTE format('CREATE TABLE public.%I AS SELECT * FROM public.%I;', backup_tbl, r.table_name);
            RAISE NOTICE 'Backup of table public.% created successfully as public.%.', r.table_name, backup_tbl;
        ELSE
            RAISE NOTICE 'Backup table public.% already exists. Skipping.', backup_tbl;
        END IF;
    END LOOP;
END $$;
