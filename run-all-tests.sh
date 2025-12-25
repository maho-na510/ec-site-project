#!/bin/bash

# EC Site - すべてのテストを実行するスクリプト

set -e

echo "=========================================="
echo "EC Site - テスト実行開始"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Rails テスト
echo -e "${YELLOW}[1/3] Rails API テストを実行中...${NC}"
echo "------------------------------------------"
if docker compose exec -T rails-api bundle exec rails test; then
    echo -e "${GREEN}✓ Rails テスト成功${NC}"
    RAILS_SUCCESS=true
else
    echo -e "${RED}✗ Rails テスト失敗${NC}"
    RAILS_SUCCESS=false
fi
echo ""

# Laravel テスト
echo -e "${YELLOW}[2/3] Laravel API テストを実行中...${NC}"
echo "------------------------------------------"
if docker compose exec -T laravel-api php artisan test; then
    echo -e "${GREEN}✓ Laravel テスト成功${NC}"
    LARAVEL_SUCCESS=true
else
    echo -e "${RED}✗ Laravel テスト失敗${NC}"
    LARAVEL_SUCCESS=false
fi
echo ""

# Frontend テスト
echo -e "${YELLOW}[3/3] Frontend テストを実行中...${NC}"
echo "------------------------------------------"
if docker compose exec -T frontend npm test -- --ci --coverage=false; then
    echo -e "${GREEN}✓ Frontend テスト成功${NC}"
    FRONTEND_SUCCESS=true
else
    echo -e "${RED}✗ Frontend テスト失敗${NC}"
    FRONTEND_SUCCESS=false
fi
echo ""

# 結果サマリー
echo "=========================================="
echo "テスト結果サマリー"
echo "=========================================="

if [ "$RAILS_SUCCESS" = true ]; then
    echo -e "${GREEN}✓ Rails API: PASS${NC}"
else
    echo -e "${RED}✗ Rails API: FAIL${NC}"
fi

if [ "$LARAVEL_SUCCESS" = true ]; then
    echo -e "${GREEN}✓ Laravel API: PASS${NC}"
else
    echo -e "${RED}✗ Laravel API: FAIL${NC}"
fi

if [ "$FRONTEND_SUCCESS" = true ]; then
    echo -e "${GREEN}✓ Frontend: PASS${NC}"
else
    echo -e "${RED}✗ Frontend: FAIL${NC}"
fi

echo "=========================================="

# すべて成功した場合は0、失敗があれば1を返す
if [ "$RAILS_SUCCESS" = true ] && [ "$LARAVEL_SUCCESS" = true ] && [ "$FRONTEND_SUCCESS" = true ]; then
    echo -e "${GREEN}すべてのテストが成功しました！${NC}"
    exit 0
else
    echo -e "${RED}一部のテストが失敗しました。${NC}"
    exit 1
fi
