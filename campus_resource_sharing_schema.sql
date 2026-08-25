-- Campus Resource Sharing Center — MySQL Schema
-- Reservations auto-confirm on creation (no approval step).

CREATE DATABASE IF NOT EXISTS campus_resource_sharing;
USE campus_resource_sharing;

-- ---------------------------------------------------------------
-- USERS
-- ---------------------------------------------------------------
CREATE TABLE users (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    full_name     VARCHAR(150)  NOT NULL,
    email         VARCHAR(255)  NOT NULL UNIQUE,
    password_hash VARCHAR(255)  NOT NULL,
    role          ENUM('student', 'staff', 'admin') NOT NULL DEFAULT 'student',
    department    VARCHAR(150),
    created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------
-- CATEGORIES  (e.g. "Electronics", "Sports Equipment", "Study Rooms")
-- ---------------------------------------------------------------
CREATE TABLE categories (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
) ENGINE=InnoDB;

-- ---------------------------------------------------------------
-- RESOURCES
-- ---------------------------------------------------------------
CREATE TABLE resources (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    owner_id    INT NOT NULL,
    category_id INT NOT NULL,
    name        VARCHAR(150) NOT NULL,
    description TEXT,
    condition_status ENUM('new', 'good', 'fair', 'needs_repair') NOT NULL DEFAULT 'good',
    status      ENUM('available', 'borrowed', 'maintenance', 'retired') NOT NULL DEFAULT 'available',
    location    VARCHAR(150),
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_resources_owner    FOREIGN KEY (owner_id)    REFERENCES users(id)      ON DELETE CASCADE,
    CONSTRAINT fk_resources_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    INDEX idx_resources_status (status),
    INDEX idx_resources_category (category_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------
-- RESOURCE_IMAGES
-- ---------------------------------------------------------------
CREATE TABLE resource_images (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    resource_id INT NOT NULL,
    url         VARCHAR(500) NOT NULL,
    CONSTRAINT fk_images_resource FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------
-- RESERVATIONS  (auto-confirmed on insert)
-- ---------------------------------------------------------------
CREATE TABLE reservations (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    resource_id INT NOT NULL,
    user_id     INT NOT NULL,
    start_time  DATETIME NOT NULL,
    end_time    DATETIME NOT NULL,
    status      ENUM('active', 'completed', 'cancelled') NOT NULL DEFAULT 'active',
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reservations_resource FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
    CONSTRAINT fk_reservations_user     FOREIGN KEY (user_id)     REFERENCES users(id)     ON DELETE CASCADE,
    CONSTRAINT chk_reservation_times CHECK (end_time > start_time),
    INDEX idx_reservations_resource_time (resource_id, start_time, end_time)
) ENGINE=InnoDB;

-- Note: MySQL has no native "no overlapping ranges" constraint.
-- Enforce non-overlapping active reservations for the same resource
-- at the application layer, or with a BEFORE INSERT trigger, e.g.:
--
-- DELIMITER //
-- CREATE TRIGGER trg_no_overlap BEFORE INSERT ON reservations
-- FOR EACH ROW
-- BEGIN
--   IF EXISTS (
--     SELECT 1 FROM reservations
--     WHERE resource_id = NEW.resource_id
--       AND status = 'active'
--       AND NEW.start_time < end_time
--       AND NEW.end_time > start_time
--   ) THEN
--     SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Resource already reserved for this time range';
--   END IF;
-- END//
-- DELIMITER ;

-- ---------------------------------------------------------------
-- REVIEWS  (tied to a completed reservation, so only borrowers can review)
-- ---------------------------------------------------------------
CREATE TABLE reviews (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    reservation_id INT NOT NULL UNIQUE,
    resource_id    INT NOT NULL,
    user_id        INT NOT NULL,
    rating         TINYINT NOT NULL,
    comment        TEXT,
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reviews_reservation FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE,
    CONSTRAINT fk_reviews_resource    FOREIGN KEY (resource_id)    REFERENCES resources(id)    ON DELETE CASCADE,
    CONSTRAINT fk_reviews_user        FOREIGN KEY (user_id)        REFERENCES users(id)        ON DELETE CASCADE,
    CONSTRAINT chk_rating_range CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------
-- WAITLIST_ENTRIES
-- ---------------------------------------------------------------
CREATE TABLE waitlist_entries (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    resource_id INT NOT NULL,
    user_id     INT NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_waitlist_resource FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
    CONSTRAINT fk_waitlist_user     FOREIGN KEY (user_id)     REFERENCES users(id)     ON DELETE CASCADE,
    UNIQUE KEY uq_waitlist_resource_user (resource_id, user_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------
-- NOTIFICATIONS
-- ---------------------------------------------------------------
CREATE TABLE notifications (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT NOT NULL,
    message    VARCHAR(500) NOT NULL,
    is_read    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notifications_user_unread (user_id, is_read)
) ENGINE=InnoDB;
