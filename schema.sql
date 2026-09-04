-- Research Tracker schema (MySQL / MariaDB)
-- Import this file in phpMyAdmin (see README step 2).
-- It creates the database, the table, and a few sample rows.

CREATE DATABASE IF NOT EXISTS research_tracker
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE research_tracker;

CREATE TABLE IF NOT EXISTS papers (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    title       VARCHAR(300) NOT NULL,
    authors     VARCHAR(300),
    venue       VARCHAR(200),                          -- journal or conference name
    type        VARCHAR(20)  NOT NULL DEFAULT 'Journal',   -- Journal / Conference
    status      VARCHAR(20)  NOT NULL DEFAULT 'Drafting',  -- Drafting / Submitted / Under Review / Accepted / Rejected
    deadline    DATE NULL,
    link        VARCHAR(500),
    notes       TEXT,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO papers (title, authors, venue, type, status, deadline, link, notes) VALUES
('Waste-MSA-Net: Lightweight Waste Classification', 'S. Ahmed et al.', 'Waste Management (Elsevier)', 'Journal', 'Under Review', '2026-03-15', '', 'Q1 target. Multi-scale attention.'),
('Rice Leaf XAI Audit', 'S. Ahmed et al.', 'ICCA 2026', 'Conference', 'Accepted', '2026-02-01', '', 'Paper #460, camera-ready done.'),
('BarkNet-Lite', 'S. Ahmed et al.', 'arXiv (in progress)', 'Journal', 'Drafting', NULL, '', 'Abstract formatting for arXiv.');
