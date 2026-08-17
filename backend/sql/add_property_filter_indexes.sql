ALTER TABLE `rets_property`
  ADD INDEX `idx_rets_property_city_price_id` (`L_City`, `L_SystemPrice`, `id`),
  ADD INDEX `idx_rets_property_zip_price_id` (`L_Zip`, `L_SystemPrice`, `id`);
