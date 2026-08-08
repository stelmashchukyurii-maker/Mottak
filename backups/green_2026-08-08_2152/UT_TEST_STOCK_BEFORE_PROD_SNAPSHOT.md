# GREEN / UT TEST stock rollback snapshot

Created: 2026-08-08 21:52 Europe/Oslo

Reason: GREEN UT Kontor / UT Lager were showing the old synthetic `ut_test_stock` inventory 10/10/10 instead of the current production availability.

## State before sync
- Bunner: 10 rows
- Hyller x30: 10 rows
- Hyller x60: 10 rows
- Active TEST orders: 0

These 30 rows were old UT-TEST-CHAIN imports from production rows that were dispatched at the time of the original test setup.

### Bunner source_mottak_scan_id
- 01f6b9a0-cc05-479f-8fb8-8177a165dd43
- 0608e5bd-9d5a-485c-8815-99766a7410be
- 0ad52c84-103f-4057-99c3-3d03005b2004
- 1155b1a4-dff7-486b-ab3a-c5d6b4bc600d
- 16c2c2c9-4bbc-400a-a53c-a4a0d8dbd155
- 1ff52cf5-4510-4331-b1fd-f5247bc9a5ee
- 24841805-a15a-4629-9e22-5d9e4160e252
- 2a0ae096-49c4-45f5-bb84-2195d0404ec0
- 2b102cd2-1e5e-4282-9173-56413493a7d7
- 2ca49812-8958-4e7b-9da5-926ddef43ae1

### Hyller x30 source_mottak_scan_id
- 1795e34a-5568-4c0b-acba-dce2e94675d8
- 30f94a24-0163-49b0-96d0-ec958cb7d50d
- 3d53a6f6-a4a4-49d3-873f-d9ea3e4e2712
- 4477b2c2-6996-457f-ba0f-8b5d08664d46
- 4c94f5a6-fb82-4635-b6cf-11e103bbf083
- 532847be-676e-49c6-bb82-38ffcdc5f926
- 59ecba79-3569-4d99-b8ff-a6e416ebc672
- 6890e430-3c86-4540-be47-1e0b5f3cf7c6
- 68bb963e-785d-4f30-8ea6-5d635f0f0679
- 6bc7349a-5de8-4277-bae5-54b3e198c5f5

### Hyller x60 source_mottak_scan_id
- 03b9ec24-897b-435e-bed4-bd20cb5b0c85
- 0bd2f301-3fad-4644-9d67-d99d68db7b87
- 1eaa82b7-bbca-46e7-98a2-31eb1a6a9b4b
- 238c7281-1ca0-48bd-a135-40a09dcaa205
- 46c2944f-c426-4b41-94b7-ede59c3b7f41
- 4825ac49-dce8-4ec1-a914-6e5321bcf8a5
- 491b748b-b334-449c-97c5-07173bc57dd9
- 4e236aef-da29-47ee-98bb-f18f86e6cc01
- 4f853755-3a75-41d6-b96b-d3c1e854f6ba
- 500a1c17-2a1b-4607-bf5c-c69920194580

## Production availability at sync time
Read-only from `mottak_scans`, `status='verified'`, `stock_status='in_stock'`:
- Bunner: 8
- Hyller x30: 7
- Hyller x60: 2

## Rollback principle
The old synthetic set can be reconstructed from the source IDs above by copying those production rows back into `ut_test_stock` as TEST/import rows. Do not modify production rows during rollback.
