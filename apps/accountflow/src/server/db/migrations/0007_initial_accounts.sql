-- ============================================================================
-- AccountFlow Database - Initial Accounts Migration
-- ============================================================================
-- Version: 1.0
-- Created: 2026-02-27
-- Description: Initialize default accounting accounts based on business requirements
--              for cross-border payment PSP company
-- ============================================================================

-- ============================================================================
-- INITIAL ACCOUNTS DATA
-- ============================================================================

-- Asset Accounts (资产类)
INSERT INTO "public"."accounts" ("company_id", "code", "name", "type", "direction", "description", "is_active")
VALUES 
  (1, '1002.001', '银行存款-备付金', 'asset', 'debit', '用于存放客户备付金的银行账户', true),
  (1, '1002.002', '银行存款-自有资金', 'asset', 'debit', '公司自有资金账户', true),
  (1, '1122.002', '应收账款-集团外往来-未提现收入', 'asset', 'debit', '集团外往来中尚未提现的收入', true),
  (1, '1221.008', '其他应收款-渠道资金', 'asset', 'debit', '应收渠道方的资金款项', true);

-- Liability Accounts (负债类)
INSERT INTO "public"."accounts" ("company_id", "code", "name", "type", "direction", "description", "is_active")
VALUES 
  (1, '2202.001', '应付账款-集团外-应付手续费', 'liability', 'credit', '应付给集团外渠道的手续费', true),
  (1, '2241.005', '其他应付款-客户备付金', 'liability', 'credit', '应付给客户的备付金款项', true),
  (1, '2221.015', '应交税费-应交所得税', 'liability', 'credit', '应交的企业所得税', true);

-- Expense Accounts (费用类)
INSERT INTO "public"."accounts" ("company_id", "code", "name", "type", "direction", "description", "is_active")
VALUES 
  (1, '6401.007', '主营业务成本-渠道成本', 'expense', 'debit', '支付渠道的手续费成本', true);

-- Revenue Accounts (收入类)
INSERT INTO "public"."accounts" ("company_id", "code", "name", "type", "direction", "description", "is_active")
VALUES 
  (1, '6111', '投资收益', 'revenue', 'credit', '对外投资产生的收益', true);
