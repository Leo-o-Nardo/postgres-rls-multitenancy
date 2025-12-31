CREATE USER app_user WITH PASSWORD 'app_password';
ALTER USER app_user CREATEDB;

CREATE DATABASE saas_iot_db OWNER app_user;
CREATE DATABASE saas_test OWNER app_user;

GRANT ALL ON SCHEMA public TO app_user;
GRANT ALL ON SCHEMA public TO app_user;