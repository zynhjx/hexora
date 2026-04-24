-- ============================================================
-- Hexora — Ticket Codes (Patch)
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- This replaces the previous 002 design.
-- ============================================================

-- ─────────────────────────────────────────────
-- 0. CLEANUP OLD DESIGN
-- ─────────────────────────────────────────────
drop table  if exists public.code_redemptions cascade;
drop table  if exists public.redeem_codes     cascade;
drop function if exists public.redeem_code(text);

-- ─────────────────────────────────────────────
-- 1. TICKET CODES TABLE
--    Each row = one physical ticket code.
--    Deleted immediately after redemption.
-- ─────────────────────────────────────────────
create table public.ticket_codes (
  code        text primary key,
  orbs_reward integer      not null default 10,
  created_at  timestamptz  not null default now()
);

-- Admins only — no client can read or list codes
alter table public.ticket_codes enable row level security;

drop policy if exists "ticket_codes: no client access" on public.ticket_codes;
create policy "ticket_codes: no client access"
  on public.ticket_codes
  using (false);

-- ─────────────────────────────────────────────
-- 2. CODE GENERATOR HELPER
--    Uses an unambiguous charset (no 0/O/1/I)
--    so printed codes on tickets are easy to read.
--    Charset (32 chars): ABCDEFGHJKLMNPQRSTUVWXYZ23456789
-- ─────────────────────────────────────────────
create or replace function public.make_ticket_code(p_length integer default 10)
returns text
language plpgsql
as $$
declare
  chars  text    := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text    := '';
  i      integer;
begin
  for i in 1..p_length loop
    result := result || substr(chars, floor(random() * 32 + 1)::integer, 1);
  end loop;
  -- Format as XXXXX-XXXXX for readability (works for length=10)
  if p_length = 10 then
    result := substr(result,1,5) || '-' || substr(result,6,5);
  end if;
  return result;
end;
$$;

-- ─────────────────────────────────────────────
-- 3. BULK CODE GENERATOR
--    Usage:  select * from generate_ticket_codes(500, 10);
--    Returns the newly inserted codes so you can export them.
-- ─────────────────────────────────────────────
create or replace function public.generate_ticket_codes(
  p_count       integer,
  p_orbs_reward integer default 10
)
returns table(code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code     text;
  v_inserted integer := 0;
  v_attempts integer := 0;
begin
  while v_inserted < p_count loop
    v_attempts := v_attempts + 1;
    if v_attempts > p_count * 10 then
      raise exception 'Too many collision retries — try a smaller batch.';
    end if;

    v_code := make_ticket_code();

    insert into public.ticket_codes (code, orbs_reward)
    values (v_code, p_orbs_reward)
    on conflict (code) do nothing;

    if found then
      v_inserted := v_inserted + 1;
      code := v_code;
      return next;
    end if;
  end loop;
end;
$$;

-- ─────────────────────────────────────────────
-- 4. REDEEM RPC
--    Validates & deletes the code in one atomic op,
--    then credits the player's orbs.
-- ─────────────────────────────────────────────
create or replace function public.redeem_code(p_code text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id  uuid    := auth.uid();
  v_reward   integer;
  v_new_orbs integer;
  v_clean    text    := upper(replace(trim(p_code), '-', ''));
  v_stored   text;
begin
  -- Normalise: accept both with and without the hyphen
  -- Try direct match first, then match after stripping hyphen from stored code
  select code, orbs_reward
  into   v_stored, v_reward
  from   public.ticket_codes
  where  replace(code, '-', '') = v_clean
  limit  1;

  if not found then
    raise exception 'INVALID_CODE';
  end if;

  -- Atomically delete the code (prevents race-condition double-use)
  delete from public.ticket_codes where code = v_stored;

  if not found then
    -- Another request deleted it between the select and delete
    raise exception 'INVALID_CODE';
  end if;

  -- Credit orbs
  update public.profiles
  set    orbs = orbs + v_reward
  where  id   = v_user_id
  returning orbs into v_new_orbs;

  return json_build_object('orbs_reward', v_reward, 'new_orbs', v_new_orbs);
end;
$$;

-- ─────────────────────────────────────────────
-- 5. HARDCODED TICKET CODES (420 codes, 10 orbs each)
--    Format: XXX-XXX-XXX  (9 chars, unambiguous charset)
-- ─────────────────────────────────────────────
insert into public.ticket_codes (code, orbs_reward) values
('23H-PAX-F5A', 10), ('27S-QLN-B5K', 10), ('288-VSF-W7S', 10), ('294-YU8-89S', 10),
('2A7-NAV-JZB', 10), ('2C5-KMM-QBW', 10), ('2ET-MK3-3SL', 10), ('2NG-AGD-UT8', 10),
('2SE-CMP-S5F', 10), ('2UL-ND5-3QW', 10), ('2VY-D62-DCF', 10), ('2XS-L36-WZD', 10),
('35S-F8M-QSL', 10), ('35W-2QW-66E', 10), ('38D-VSA-UZZ', 10), ('38W-2YK-RZ9', 10),
('3A4-F8S-SMX', 10), ('3AL-P4B-HAP', 10), ('3DR-JVJ-DNM', 10), ('3HR-76Y-PQY', 10),
('3JJ-BJY-QK4', 10), ('3KN-3GC-4XZ', 10), ('3KN-6X8-8Q5', 10), ('3NL-ARD-BA6', 10),
('3NS-QXN-6Y5', 10), ('3QA-4VK-SE3', 10), ('3VD-9PN-RJ6', 10), ('3X5-VK9-FQF', 10),
('3ZU-3P2-M5F', 10), ('42Y-QR3-255', 10), ('494-DLZ-QJW', 10), ('4D3-VGZ-E97', 10),
('4FS-DQ2-D8Z', 10), ('4LU-8SZ-3E4', 10), ('4TL-QHK-MWX', 10), ('4VL-FMX-P84', 10),
('55T-4HF-4V8', 10), ('57C-GFW-L6F', 10), ('5AU-RSA-6E9', 10), ('5BD-KL4-6M2', 10),
('5BN-NUJ-FYH', 10), ('5EA-JAS-Q27', 10), ('5FL-TM9-BCV', 10), ('5G8-AX2-YPV', 10),
('5HW-GBE-RY9', 10), ('5L9-PL4-RDQ', 10), ('5MW-QYM-CAT', 10), ('5R4-3H2-6SY', 10),
('5RQ-5E3-5YK', 10), ('5UA-96X-X6L', 10), ('5Y7-ETM-SRV', 10), ('64P-MJ8-889', 10),
('67W-2EM-9AT', 10), ('6CA-25L-PWF', 10), ('6G6-Y5R-N68', 10), ('6GX-4GB-4BT', 10),
('6J8-W89-FA2', 10), ('6MZ-5BP-ETM', 10), ('6S2-NRL-4F9', 10), ('6T8-EQR-R2M', 10),
('6TY-Y7D-KVY', 10), ('6U3-6Y6-7ZA', 10), ('6XD-PBE-NQ7', 10), ('78P-PWV-QGA', 10),
('795-Y7X-Y7F', 10), ('79D-CYC-877', 10), ('7FK-HLC-8YU', 10), ('7H5-847-H9N', 10),
('7LR-Z9P-VS9', 10), ('7PX-595-QUJ', 10), ('7TQ-MGG-VZ4', 10), ('7UV-Y6R-PML', 10),
('836-E52-EBZ', 10), ('83V-AB7-ZCS', 10), ('85J-AX2-9VL', 10), ('86U-KTX-YC7', 10),
('88Y-A8N-SRA', 10), ('89Y-FVE-7XY', 10), ('8CD-5BH-APQ', 10), ('8CF-G8M-MDP', 10),
('8CZ-MFE-LD9', 10), ('8DH-389-UKG', 10), ('8E8-DM7-SSU', 10), ('8GE-275-6YF', 10),
('8HT-TEA-MH9', 10), ('8K6-EGF-F65', 10), ('8KN-XZP-TFU', 10), ('8MF-L89-ART', 10),
('8QQ-9AA-CPF', 10), ('8SW-SU6-Z6C', 10), ('8TU-3ZB-BMN', 10), ('8WB-5BD-7PA', 10),
('8WB-LRB-MN4', 10), ('8WX-3L4-DED', 10), ('8XS-3JA-853', 10), ('8YV-PFM-8J2', 10),
('97G-Q3R-DDZ', 10), ('99Z-9ZJ-5LG', 10), ('9AH-47F-9QY', 10), ('9AY-FFT-YGW', 10),
('9AY-MFL-7TS', 10), ('9BC-VVP-XVJ', 10), ('9BD-ZQV-VXW', 10), ('9DG-2Y7-XND', 10),
('9DJ-K2K-45U', 10), ('9DM-Z9W-VFE', 10), ('9HT-N57-Q5T', 10), ('9N5-UMF-M49', 10),
('9S6-Q2K-HKZ', 10), ('9TL-5FT-24U', 10), ('9WN-UWR-BTS', 10), ('9WX-QML-FDL', 10),
('9YS-RSK-BY4', 10), ('9Z4-FEP-R38', 10), ('9ZQ-LBM-GK8', 10), ('A2Z-ACW-LUG', 10),
('A56-FX3-YXP', 10), ('A5R-PPC-NRK', 10), ('A6U-JQW-HAQ', 10), ('ANL-PLL-NGK', 10),
('ARX-2CC-QYW', 10), ('AWB-A9W-M3J', 10), ('B5R-2FP-ZAQ', 10), ('B5U-DRU-7XS', 10),
('B7E-CSS-64H', 10), ('B8K-GWQ-7PG', 10), ('BAU-67N-HQT', 10), ('BGF-7JP-FJP', 10),
('BKL-DHR-3BH', 10), ('BKT-7WY-XNF', 10), ('BMM-6U7-G38', 10), ('BNH-FCV-SD4', 10),
('BPU-95V-RYV', 10), ('BQ3-AYH-ZS6', 10), ('BQ7-LW7-JZT', 10), ('BRV-6HR-AS6', 10),
('BT4-DQQ-P79', 10), ('BY8-ZY4-KQC', 10), ('C2G-467-BSL', 10), ('C2Q-55N-KKP', 10),
('C32-MHH-XDM', 10), ('C3B-DVG-V5Q', 10), ('C4B-XU4-TLN', 10), ('CDM-RY8-CPC', 10),
('CGC-QWD-4VM', 10), ('CGZ-87B-SMK', 10), ('CHX-9W2-H2F', 10), ('CQK-99S-JN7', 10),
('CRJ-ZKA-ESN', 10), ('CUM-2WK-WA5', 10), ('CUP-B2V-LE2', 10), ('CVP-N92-RRG', 10),
('CWD-PH3-YBC', 10), ('CYF-2LK-L8L', 10), ('D2J-X6L-PJY', 10), ('D8Z-WT2-W47', 10),
('DAR-8M3-76G', 10), ('DFA-6ZE-F88', 10), ('DFF-CPQ-87Q', 10), ('DFG-U3S-M6C', 10),
('DFX-MDM-W9T', 10), ('DKE-CVV-SC7', 10), ('DKW-JA3-DDF', 10), ('E2R-DNF-TAW', 10),
('E4X-RX8-UN4', 10), ('E4Y-ZTC-8RV', 10), ('E5Q-X5F-P2V', 10), ('E8L-BN7-ZXD', 10),
('EK4-QN5-89B', 10), ('EN3-N8N-X3S', 10), ('EY3-YHB-XPJ', 10), ('EZX-TLL-2DV', 10),
('F6B-EAG-UTS', 10), ('F6L-G2G-ZTA', 10), ('F8Z-9PX-3QB', 10), ('FCN-TYC-7MP', 10),
('FE9-4ZM-Q7W', 10), ('FGZ-HJW-GMS', 10), ('FHP-AQ6-2FM', 10), ('FK6-SL8-A2J', 10),
('FLB-CQR-8JP', 10), ('FLF-83F-VGG', 10), ('FM8-YWZ-YHW', 10), ('FNC-XNM-7G8', 10),
('FWA-DWZ-Q6P', 10), ('FYT-P6L-HKW', 10), ('FZ2-6DR-A7T', 10), ('G2H-Q6A-KJP', 10),
('GED-R4K-VDV', 10), ('GHT-L9R-GBZ', 10), ('GJK-L6N-4P3', 10), ('GMG-LLW-GPN', 10),
('GNB-9AG-FRV', 10), ('GPZ-3DE-9NQ', 10), ('GVX-YAX-72Z', 10), ('GW4-AVG-Z48', 10),
('GWQ-UNK-WXG', 10), ('GWU-GD6-48U', 10), ('GXN-W83-VBL', 10), ('GZC-N2A-U87', 10),
('H2V-8LT-BLS', 10), ('H46-F48-4EC', 10), ('H4W-7PR-HKP', 10), ('H79-SDF-RAV', 10),
('H99-25H-WGC', 10), ('HCW-WKA-D4E', 10), ('HDV-EG5-XTH', 10), ('HFN-JW8-CJF', 10),
('HNW-7FW-FE2', 10), ('HQ6-8JZ-UWC', 10), ('HQF-KF6-QDE', 10), ('HUF-W3Q-D56', 10),
('HVZ-CHB-9LS', 10), ('HW7-LPH-2M4', 10), ('HZ9-F22-D99', 10), ('HZD-TA3-XQW', 10),
('HZQ-NFY-3EH', 10), ('J2G-MB6-NK7', 10), ('J2K-LZB-BPU', 10), ('J3A-BNF-5SZ', 10),
('J6C-JDN-MUB', 10), ('J7H-5MQ-2CL', 10), ('JDZ-9ES-G4Y', 10), ('JEA-3HQ-KGS', 10),
('JGU-GSQ-7RA', 10), ('JHW-7A5-TF2', 10), ('JJQ-YXM-N4M', 10), ('JM7-H6M-7D7', 10),
('JNG-KJ4-6T4', 10), ('JPS-FYG-F86', 10), ('JRE-BWV-U26', 10), ('JS2-V3P-AA6', 10),
('JUK-DF8-2P6', 10), ('K2X-WE4-V5Y', 10), ('K5N-XSZ-AM3', 10), ('K6T-ZNW-T3P', 10),
('K9L-CPF-7Z5', 10), ('KH6-H2D-7TQ', 10), ('KHR-L42-R26', 10), ('KJP-RHH-XE7', 10),
('KP8-WL3-NAP', 10), ('KUU-DA8-HY2', 10), ('KVS-MHU-P2U', 10), ('KWR-G3S-V5Z', 10),
('L2U-PZQ-LRS', 10), ('L56-FSG-PDJ', 10), ('L9C-Q6F-M76', 10), ('LD8-BAZ-VU8', 10),
('LH3-78C-DR9', 10), ('LPV-PS5-4ZK', 10), ('LUD-4LQ-DJ6', 10), ('M4B-NK6-U38', 10),
('M98-2XG-X88', 10), ('M9C-YPM-RPA', 10), ('MC7-NH7-9WB', 10), ('MJ2-B7W-AX9', 10),
('MJ6-UWD-DVZ', 10), ('MK6-UQR-AE7', 10), ('MQ2-WEM-KHY', 10), ('MRA-HAJ-CM6', 10),
('MWX-QNM-Y47', 10), ('MX3-7HF-4GX', 10), ('MY3-NMT-TNT', 10), ('N4E-VET-7LZ', 10),
('N5L-8Q6-HC4', 10), ('N6W-BSE-GJW', 10), ('N86-9NG-3DQ', 10), ('NEP-3T2-E3W', 10),
('NGD-GFY-2HV', 10), ('NJF-KW4-39S', 10), ('NM5-GS6-4AS', 10), ('NN5-WF2-NHR', 10),
('NSX-GA8-X9G', 10), ('NV9-MQ6-PYT', 10), ('NXL-4JL-35G', 10), ('NY5-ZR9-DWS', 10),
('NY9-JVW-358', 10), ('P34-TFY-Q63', 10), ('P4Z-QUB-X2Z', 10), ('P5V-WMD-HTE', 10),
('P6F-34T-4ZK', 10), ('PB5-DCG-VVH', 10), ('PCH-NAC-7YZ', 10), ('PCL-9ZH-LQB', 10),
('PEW-9J9-D5Y', 10), ('PGZ-5VU-25V', 10), ('PJM-JFW-3H2', 10), ('PLB-QLC-3QH', 10),
('PTY-F87-92L', 10), ('PWG-7VC-FHK', 10), ('PZJ-5UM-PHB', 10), ('Q4K-RRK-LAE', 10),
('Q6N-RJ4-3YE', 10), ('Q8U-5JN-QED', 10), ('QA8-MWB-V3G', 10), ('QCK-6UT-PBU', 10),
('QCL-Z5U-NAR', 10), ('QNN-C9Q-SBT', 10), ('QP8-AMH-CLZ', 10), ('QQK-3UT-QYF', 10),
('QWZ-FKZ-9HS', 10), ('R2G-9K7-4ZT', 10), ('R2K-HL6-CRP', 10), ('RA5-2CL-P48', 10),
('RCK-78N-FDR', 10), ('RDT-PWW-XMU', 10), ('RFD-NSM-Z33', 10), ('RFU-ABX-3HA', 10),
('RFV-BAL-YDA', 10), ('RGC-5M7-67V', 10), ('RHD-TZ3-Z4W', 10), ('RNP-5LX-ZE6', 10),
('RQZ-PJ9-A8W', 10), ('RRD-AK9-KZW', 10), ('RVU-CLD-VCK', 10), ('S62-F7A-3MS', 10),
('SAF-Y8A-P26', 10), ('SB4-SK7-4DM', 10), ('SBA-JTA-TAC', 10), ('SED-QFM-FCE', 10),
('SGN-HWR-ZWM', 10), ('SGY-W5L-VS4', 10), ('STG-V45-CZB', 10), ('STY-FC6-9AM', 10),
('SU9-JAB-NU5', 10), ('SWS-XAE-ZYQ', 10), ('SXA-72J-NUQ', 10), ('SY5-HML-5ZD', 10),
('T2D-WXK-37Q', 10), ('T5E-J35-NQK', 10), ('T6S-BBC-LDF', 10), ('T84-3VJ-RVD', 10),
('TD6-5SY-PRE', 10), ('TEK-4YZ-PW6', 10), ('TGZ-JCP-4ST', 10), ('TJT-9EN-NLG', 10),
('TKU-J7E-RR3', 10), ('TLA-2MD-8LN', 10), ('TLM-6JD-GQE', 10), ('TSW-8P3-JLU', 10),
('TVL-U8N-32F', 10), ('TXQ-RCE-LSU', 10), ('U25-DAK-Z24', 10), ('U2B-FXR-KWF', 10),
('U44-Q54-QBE', 10), ('U6Q-SHS-U7H', 10), ('U76-LSF-ARP', 10), ('U79-D9J-KEW', 10),
('U7D-3MF-V4P', 10), ('U7P-QLW-Y3H', 10), ('U93-22X-93E', 10), ('UHY-RQN-8EP', 10),
('USK-US5-NSX', 10), ('UUY-5EB-9XK', 10), ('UW2-AV2-TAM', 10), ('V2C-EFX-28N', 10),
('V44-NPG-TKE', 10), ('V8G-E8G-SGS', 10), ('VF8-YX2-VVL', 10), ('VK5-5BE-K9A', 10),
('VMX-5UH-DHJ', 10), ('VQC-BPT-YHH', 10), ('VUJ-BHY-58D', 10), ('VZV-22F-CC8', 10),
('W3N-5HD-LRG', 10), ('WCC-ATC-YSZ', 10), ('WCS-TNH-KX6', 10), ('WE4-232-7RL', 10),
('WE4-G9Q-HCM', 10), ('WK8-7FR-5YG', 10), ('WNH-BFR-TCT', 10), ('WNZ-6GB-EQ5', 10),
('WU5-R88-4BV', 10), ('WV4-7K9-SE4', 10), ('X2M-REY-F8D', 10), ('X63-JH2-ZB6', 10),
('X6E-E36-WT5', 10), ('X74-ZEQ-BTP', 10), ('X7J-J5Z-CMK', 10), ('X8K-V82-5Q5', 10),
('X9G-KPH-PDC', 10), ('XA3-A6F-ADV', 10), ('XAB-U3N-DQ4', 10), ('XAX-445-FJY', 10),
('XDB-S8B-E3L', 10), ('XDD-ADN-AB8', 10), ('XHS-RN8-NXB', 10), ('XLR-LLF-DLH', 10),
('XRM-XT9-TNT', 10), ('XU2-45M-WBM', 10), ('XXC-X7L-E4Q', 10), ('Y27-NUE-WVV', 10),
('Y5F-KGM-SZJ', 10), ('Y62-5LJ-5LG', 10), ('YCL-4CH-XNG', 10), ('YEW-QMW-N6M', 10),
('YJL-VP7-ADJ', 10), ('YSU-APR-KWA', 10), ('YTF-MX8-W24', 10), ('YTQ-8EF-QE9', 10),
('YXG-7GK-QGJ', 10), ('YXJ-Z6X-4U2', 10), ('YXN-YYL-VKK', 10), ('YYA-4ZW-R6A', 10),
('Z2G-UVG-568', 10), ('Z3W-7T3-C9V', 10), ('Z54-TGV-PSA', 10), ('Z57-8M2-RPL', 10),
('Z5X-3AX-PUN', 10), ('Z66-AER-BXB', 10), ('Z69-T3T-7UN', 10), ('Z8G-P2Y-X2M', 10),
('ZD5-USA-SWW', 10), ('ZDG-8B5-CS9', 10), ('ZHP-WJS-MCZ', 10), ('ZHT-P72-N54', 10),
('ZLF-2NF-WQ6', 10), ('ZQV-LYK-45R', 10), ('ZTQ-U4Q-NPF', 10), ('ZXL-ZXM-NDP', 10)
on conflict (code) do nothing;
