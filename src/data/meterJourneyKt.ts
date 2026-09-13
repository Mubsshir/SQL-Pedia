export interface JourneyPhase {
  id: string;
  stepNumber: number;
  title: string;
  shortName: string;
  badgeColor: string;
  iconName: string;
  storyTitle: string;
  storySummary: string;
  businessContext: string[];
  tablesInvolved: {
    name: string;
    prefixType: 'M_ (Master)' | 'L_ (Lookup)' | 'T_ (Transactional)' | 'S_ (Staging)' | 'R_ (Reporting)';
    description: string;
    keyColumns: string[];
  }[];
  coreProcedure: {
    procName: string;
    description: string;
    parameters: string[];
    sampleSql: string;
  };
  juniorGotchas: {
    question: string;
    answer: string;
    verificationQuery: string;
  }[];
}

export const METER_JOURNEY_PHASES: JourneyPhase[] = [
  {
    id: 'procurement',
    stepNumber: 1,
    title: 'Procurement & Warehouse Inwarding',
    shortName: 'Store Inward',
    badgeColor: 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-500/30',
    iconName: 'Package',
    storyTitle: 'From Factory Test Bench to Utility Central Store',
    storySummary: 'Before a smart meter touches a consumer wall, thousands of units arrive in batches from manufacturers (e.g. Genus, L&T, Secure). Each meter undergoes laboratory accuracy testing, barcode validation, and bulk inward registration.',
    businessContext: [
      'Manufacturer delivers consignment with factory acceptance test (FAT) certificate and electronic packing list.',
      'Quality assurance engineers test sample meters on test benches for Class 1.0 or 0.5s measurement accuracy.',
      'Storekeeper scans 2D DataMatrix / Barcodes to bulk inward serial numbers, optical MAC addresses, and GPRS SIM IMSI into the inventory database.',
      'Meter initial lifecycle state is set to "IN_STORE_READY".',
    ],
    tablesInvolved: [
      {
        name: 'M_Meter_Master',
        prefixType: 'M_ (Master)',
        description: 'Master catalog of every physical meter procured across all DISCOM zones.',
        keyColumns: ['meter_serial_no (PK)', 'manufacturer_id', 'device_type_id', 'sim_imsi', 'meter_phase', 'current_rating', 'inventory_status'],
      },
      {
        name: 'L_Manufacturer',
        prefixType: 'L_ (Lookup)',
        description: 'Standard lookup of approved meter hardware vendors.',
        keyColumns: ['manufacturer_id (PK)', 'manufacturer_name', 'model_code', 'contact_info'],
      },
      {
        name: 'L_Device_Type',
        prefixType: 'L_ (Lookup)',
        description: 'Meter specifications: 1-Phase, 3-Phase Whole Current, or CT/PT Operated.',
        keyColumns: ['device_type_id (PK)', 'type_name', 'rated_voltage', 'rated_current'],
      },
    ],
    coreProcedure: {
      procName: 'usp_inv_InwardMeterBatch',
      description: 'Validates serial format, checks for duplicate barcodes, and inserts bulk inventory records.',
      parameters: ['@BatchReference VARCHAR(50)', '@ManufacturerId INT', '@DeviceTypeId INT', '@MeterCount INT'],
      sampleSql: `EXEC dbo.usp_inv_InwardMeterBatch 
    @BatchReference = 'BATCH-2026-Q3-09',
    @ManufacturerId = 2, -- Genus
    @DeviceTypeId = 3,   -- 3-Phase Smart
    @MeterCount = 500;`,
    },
    juniorGotchas: [
      {
        question: 'What if a meter barcode was already registered previously in another district?',
        answer: 'M_Meter_Master has a UNIQUE CONSTRAINT on meter_serial_no. Duplicate attempts trigger error 2627. Always check if the serial exists with a previous scrapped status before re-inwarding.',
        verificationQuery: `SELECT meter_serial_no, inventory_status, created_date 
FROM dbo.M_Meter_Master(NOLOCK) 
WHERE meter_serial_no = 'MTR-2026-98214';`,
      },
    ],
  },
  {
    id: 'wfm-dispatch',
    stepNumber: 2,
    title: 'Work Order & Technician Dispatch (WFM)',
    shortName: 'WFM Dispatch',
    badgeColor: 'bg-sky-100 text-sky-950 border-sky-300 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-500/30',
    iconName: 'Send',
    storyTitle: 'Assigning Installation Task to Field Technicians',
    storySummary: 'When a new connection is approved or a burnt meter ticket is raised, the Workforce Management (WFM) engine generates a digital work order, reserves a meter, and pushes task details to the technician mobile app.',
    businessContext: [
      'Customer Care or DISCOM ERP (SAP/Oracle CC&B) approves consumer service request for new smart meter.',
      'WFM automated dispatch algorithm batches work orders by feeder, subdivision, and technician geo-location.',
      'The designated smart meter is transitioned from "IN_STORE_READY" to "ISSUED_FOR_INSTALLATION".',
      'Technician receives notification on Android mobile app with consumer name, address, sanctioned load, and target pole location.',
    ],
    tablesInvolved: [
      {
        name: 'M_WorkOrder',
        prefixType: 'M_ (Master)',
        description: 'Core work order master entity containing ticket lifecycle and consumer requirements.',
        keyColumns: ['work_order_id (PK)', 'work_order_no', 'work_order_type_id', 'consumer_account_no', 'assigned_technician_id', 'status_id'],
      },
      {
        name: 'T_WFM_Task_Assignment',
        prefixType: 'T_ (Transactional)',
        description: 'Audit trail tracking which technician received the job, dispatch time, and SLA deadlines.',
        keyColumns: ['assignment_id (PK)', 'work_order_id', 'technician_id', 'dispatched_time', 'target_completion_date'],
      },
      {
        name: 'L_WorkOrder_Type',
        prefixType: 'L_ (Lookup)',
        description: 'Work order categories: New Meter Installation (MI), Replacement (MR), Inspection, or Disconnection.',
        keyColumns: ['type_id (PK)', 'type_code', 'description', 'sla_hours'],
      },
    ],
    coreProcedure: {
      procName: 'usp_wfm_DispatchWorkOrder',
      description: 'Binds available meter serial to work order and syncs task to mobile technician queue.',
      parameters: ['@WorkOrderId BIGINT', '@TechnicianId INT', '@MeterSerialNo VARCHAR(30)'],
      sampleSql: `EXEC dbo.usp_wfm_DispatchWorkOrder 
    @WorkOrderId = 981240,
    @TechnicianId = 142,
    @MeterSerialNo = 'MTR-2026-98214';`,
    },
    juniorGotchas: [
      {
        question: 'Why does the technician mobile app show "No Jobs Assigned" when the database has work orders?',
        answer: 'Check the status_id in M_WorkOrder and verify that assigned_technician_id matches the technician login ID in M_Technician_Master. Also verify the technician subdivision matches the work order substation.',
        verificationQuery: `SELECT w.work_order_no, w.status_id, t.technician_name, w.assigned_technician_id 
FROM dbo.M_WorkOrder w(NOLOCK)
LEFT JOIN dbo.M_Technician t(NOLOCK) ON w.assigned_technician_id = t.technician_id
WHERE w.work_order_id = 981240;`,
      },
    ],
  },
  {
    id: 'commissioning',
    stepNumber: 3,
    title: 'Site Installation & Consumer Commissioning',
    shortName: 'Site Commissioning',
    badgeColor: 'bg-indigo-100 text-indigo-950 border-indigo-300 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-500/30',
    iconName: 'Smartphone',
    storyTitle: 'Physical Wall Mounting, Barcode Scan & Consumer Binding',
    storySummary: 'The physical transformation happens at the consumer premise. The technician removes the old electromechanical meter, mounts the smart meter, captures GPS coordinates, snaps photos, tags the tamper seal, and submits the commissioning form.',
    businessContext: [
      'If Meter Replacement (MR): Technician photographs old meter dials and records final kWh reading for closing balance.',
      'Technician connects incoming phase/neutral cables into the smart meter terminal block.',
      'Technician snaps blue polycarbonate tamper seal with unique seal barcode to prevent unauthorized opening.',
      'Using the mobile app optical probe / barcode scanner, technician captures: meter serial, seal serial, GPS coordinates, and distribution transformer (DTR) code.',
      'On successful submit, the meter is officially COMMISSIONED and bound to the consumer account number.',
    ],
    tablesInvolved: [
      {
        name: 'T_Meter_Installation',
        prefixType: 'T_ (Transactional)',
        description: 'Complete commissioning audit log: GPS coordinates, old meter closing reading, and seal barcode.',
        keyColumns: ['installation_id (PK)', 'work_order_id', 'consumer_id', 'meter_serial_no', 'seal_number', 'old_meter_kwh', 'gps_latitude', 'gps_longitude'],
      },
      {
        name: 'L_Consumer_Lookup',
        prefixType: 'L_ (Lookup)',
        description: 'Primary consumer reference table updated with the active meter serial.',
        keyColumns: ['consumer_id (PK)', 'consumer_no', 'consumer_name', 'active_meter_serial_no', 'is_active'],
      },
      {
        name: 'L_Meter_Lookup',
        prefixType: 'L_ (Lookup)',
        description: 'Fast lookup index mapping meter serial number to active consumer ID and DTR instance.',
        keyColumns: ['meter_serial_no (PK)', 'consumer_id', 'dtr_id', 'feeder_id', 'install_date'],
      },
    ],
    coreProcedure: {
      procName: 'usp_wfm_CommissionMeter',
      description: 'Atomic transaction updating consumer active meter, closing work order, and writing installation audit.',
      parameters: ['@WorkOrderId BIGINT', '@MeterSerialNo VARCHAR(30)', '@ConsumerNo VARCHAR(30)', '@SealNumber VARCHAR(30)', '@Latitude DECIMAL(9,6)', '@Longitude DECIMAL(9,6)'],
      sampleSql: `EXEC dbo.usp_wfm_CommissionMeter 
    @WorkOrderId = 981240,
    @MeterSerialNo = 'MTR-2026-98214',
    @ConsumerNo = 'CONS-882104',
    @SealNumber = 'SEAL-BL-44910',
    @Latitude = 28.459497,
    @Longitude = 77.026638;`,
    },
    juniorGotchas: [
      {
        question: 'Why does L_Consumer_Lookup still show the old meter serial after field installation?',
        answer: 'If the mobile app was offline, submissions land in S_WFM_Offline_Queue_Stg until synced. Verify whether the mobile sync API executed usp_wfm_CommissionMeter or if it failed in the staging queue with a validation error.',
        verificationQuery: `SELECT consumer_no, active_meter_serial_no, is_active 
FROM dbo.L_Consumer_Lookup(NOLOCK) 
WHERE consumer_no = 'CONS-882104';`,
      },
    ],
  },
  {
    id: 'hes-discovery',
    stepNumber: 4,
    title: 'HES Discovery & Network Handshake',
    shortName: 'HES Network Ping',
    badgeColor: 'bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-500/30',
    iconName: 'Wifi',
    storyTitle: 'First Digital Heartbeat: Cellular Modem Dials the Head End System',
    storySummary: 'Once mains power energizes the smart meter, its internal 4G/NB-IoT cellular NIC module searches for a cellular tower, establishes a secure TCP tunnel to the HES server, and transmits its first "BOOT_NOTIFICATION" telemetry payload.',
    businessContext: [
      'Meter powers up; internal GPRS/Cellular modem establishes secure APN connection with telecom provider.',
      'Meter dials Head End System (HES) gateway and performs mutual TLS handshake / DLMS authentication.',
      'Meter transmits initial telemetry packet: serial number, firmware version, clock sync time, and signal quality (CSQ/RSRP).',
      'HES gateway ingests JSON/DLMS binary payload into staging tables and responds with ACK.',
      'Meter status changes to "COMMUNICATING" in the network operations center (NOC).',
    ],
    tablesInvolved: [
      {
        name: 'S_HES_Device_Registration_Stg',
        prefixType: 'S_ (Staging)',
        description: 'Raw inbound registration payloads received by HES REST / MQTT adapters.',
        keyColumns: ['payload_id (PK)', 'meter_serial_no', 'ip_address', 'received_timestamp', 'raw_json_payload', 'is_processed'],
      },
      {
        name: 'L_Network_Meter_Lookup',
        prefixType: 'L_ (Lookup)',
        description: 'Network communication lookup storing current IP address, firmware, and last communication heartbeat.',
        keyColumns: ['meter_serial_no (PK)', 'hes_system_id', 'ip_address', 'last_communication_time', 'signal_strength'],
      },
      {
        name: 'T_Meter_Events_HES',
        prefixType: 'T_ (Transactional)',
        description: 'Tamper and system events received during first boot (Power On, Clock Synced, Firmware OK).',
        keyColumns: ['event_id (PK)', 'meter_serial_no', 'event_code', 'event_time', 'logged_time'],
      },
    ],
    coreProcedure: {
      procName: 'usp_hes_ProcessDiscoveryPayload',
      description: 'Parses JSON payload from staging using OPENJSON, updates network lookup, and registers meter in HES directory.',
      parameters: ['@PayloadId BIGINT'],
      sampleSql: `EXEC dbo.usp_hes_ProcessDiscoveryPayload 
    @PayloadId = 5510420;`,
    },
    juniorGotchas: [
      {
        question: 'The meter was powered on at site, but why is there no record in HES?',
        answer: 'Check signal_strength (CSQ) and SIM activation. In the database, check S_HES_Device_Registration_Stg for raw payloads with is_processed = 0 or check t_job_error for parsing exceptions.',
        verificationQuery: `SELECT TOP 5 payload_id, meter_serial_no, received_timestamp, is_processed 
FROM mdms_stg.dbo.S_HES_Device_Registration_Stg(NOLOCK) 
WHERE meter_serial_no = 'MTR-2026-98214' 
ORDER BY received_timestamp DESC;`,
      },
    ],
  },
  {
    id: 'mdms-hierarchy',
    stepNumber: 5,
    title: 'MDMS Hierarchy Binding & VEE Daily Billing',
    shortName: 'MDMS Activation',
    badgeColor: 'bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-500/30',
    iconName: 'Database',
    storyTitle: 'The Holy Grail: Joining Grid Topology & Ingesting Billable Energy',
    storySummary: 'Now that the meter is installed on the wall and communicating with HES, MDMS binds it into the electrical grid hierarchy (Substation -> Feeder -> DTR -> Meter). Midnight batch ETL jobs ingest 15-minute interval data, execute VEE rules, and generate billable determinants.',
    businessContext: [
      'MDMS hierarchy job binds the new meter to its electrical tree: Substation ➔ 11kV Feeder ➔ 250kVA DTR ➔ Consumer Meter.',
      'Daily 00:00 batch job evaluates watermark m_max_movedata to pull newly arrived load profiles and midnight billing snaps.',
      'VEE Engine (Validation, Estimation, Editing) runs: checks for spike thresholds, negative consumption, and clock drifts.',
      'Validated energy values are populated into R_Consumer_Daily_Billing, enabling DISCOM billing systems to issue monthly electricity bills.',
      'Meter is now in full commercial production operation!',
    ],
    tablesInvolved: [
      {
        name: 'M_Consumer_Hierarchy',
        prefixType: 'M_ (Master)',
        description: 'Complete electrical topology linking consumer meter to Substation, Feeder, and DTR.',
        keyColumns: ['hierarchy_id (PK)', 'consumer_id', 'meter_serial_no', 'substation_id', 'feeder_id', 'dtr_id', 'is_active'],
      },
      {
        name: 'T_Meter_Load_Profile_Hourly',
        prefixType: 'T_ (Transactional)',
        description: 'High-frequency 15-minute / hourly interval data (kWh, kVAh, Voltage, Current, Power Factor).',
        keyColumns: ['meter_serial_no', 'read_timestamp', 'active_import_kwh', 'voltage_v', 'current_a', 'power_factor'],
      },
      {
        name: 'R_Consumer_Daily_Billing',
        prefixType: 'R_ (Reporting)',
        description: 'Official aggregated billing determinants used by ERP/SAP billing engines for monthly invoicing.',
        keyColumns: ['bill_date', 'consumer_id', 'meter_serial_no', 'daily_consumption_kwh', 'max_demand_kw'],
      },
    ],
    coreProcedure: {
      procName: 'usp_import_hes_daily_reads',
      description: 'Watermarked staging-to-transaction movement procedure with VEE validation and t_job_error logging.',
      parameters: ['@BatchDate DATE', '@MaxMovedataWatermark BIGINT OUTPUT'],
      sampleSql: `DECLARE @NewWatermark BIGINT;
EXEC dbo.usp_import_hes_daily_reads 
    @BatchDate = '2026-09-12',
    @MaxMovedataWatermark = @NewWatermark OUTPUT;
SELECT @NewWatermark AS [UpdatedPayloadWatermark];`,
    },
    juniorGotchas: [
      {
        question: 'Why are billing reports showing ZERO consumption even though the meter is sending reads to HES?',
        answer: 'The meter is not mapped in M_Consumer_Hierarchy! If a meter is commissioned in WFM but missing from M_Consumer_Hierarchy, the reporting ETL ignores its rows during energy aggregation. Always verify the hierarchy link.',
        verificationQuery: `SELECT h.consumer_id, h.meter_serial_no, h.feeder_id, h.dtr_id, h.is_active 
FROM dbo.M_Consumer_Hierarchy h(NOLOCK) 
WHERE h.meter_serial_no = 'MTR-2026-98214';`,
      },
    ],
  },
];
