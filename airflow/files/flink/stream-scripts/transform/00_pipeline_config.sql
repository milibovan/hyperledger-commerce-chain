-- =============================================================
-- FILE: 00_pipeline_config.sql
-- DESC: Global checkpointing and pipeline settings.
--       Run this first, before any DDL or DML files.
-- =============================================================

SET 'execution.checkpointing.interval'            = '1min';
SET 'execution.checkpointing.mode'                = 'EXACTLY_ONCE';
SET 'execution.checkpointing.timeout'             = '10min';
SET 'execution.checkpointing.min-pause-between'   = '30s';
SET 'execution.checkpointing.max-concurrent'      = '1';

-- Tolerate up to 3 task failures before the job fails
SET 'restart-strategy'                            = 'fixed-delay';
SET 'restart-strategy.fixed-delay.attempts'       = '3';
SET 'restart-strategy.fixed-delay.delay'          = '10s';

SET 'pipeline.name' = 'transform-zone-ingestion';

SET 'parallelism.default'              = '2';