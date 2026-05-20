-- テスト用DBを作成する（init.sqlはMySQLコンテナ初回起動時のみ実行される）
CREATE DATABASE IF NOT EXISTS `ec_site_test` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ec_user に開発・テスト用DBの権限を付与する
GRANT ALL PRIVILEGES ON `ec_site_development`.* TO 'ec_user'@'%';
GRANT ALL PRIVILEGES ON `ec_site_test`.* TO 'ec_user'@'%';
FLUSH PRIVILEGES;
