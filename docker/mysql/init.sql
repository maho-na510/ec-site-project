-- ec_user に開発・テスト用DBの権限を付与する
GRANT ALL PRIVILEGES ON `ec_site_development`.* TO 'ec_user'@'%';
GRANT ALL PRIVILEGES ON `ec_site_test`.* TO 'ec_user'@'%';
FLUSH PRIVILEGES;
