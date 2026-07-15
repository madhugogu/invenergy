// IUXHUB core helpers and data access. Loaded before IUXHUB.ui.js and IUXHUB.js.
  var gGanttGlobal = {};
  gGanttGlobal.LookAheadstore = {};
  gGanttGlobal.Key = "";
  gGanttGlobal.WorkorderStatusStore = {};
  gGanttGlobal.WorkorderTypeStore = {};
  gGanttGlobal.DepartmentStore = {};
  gGanttGlobal.OrganizationStore = {};
  gGanttGlobal.DataSpyStore = {};
  gGanttGlobal.ScaleMode = {};
  gGanttGlobal.SchedGroups = {}; 
  gGanttGlobal.Personal = {};
  gGanttGlobal.ListColumnsStore = [];
  gGanttGlobal.contextMenuOpen = false;
  gGanttGlobal.InitialConfigStore = {};
  gGanttGlobal.TasksModified = [];
  gGanttGlobal.ColorCombinations = [];
  gGanttGlobal.EstimatedHours = [];
  gGanttGlobal.WorkOrderData = [];
  gGanttGlobal.ResourceData = [];
  gGanttGlobal.AnalyticsCache = {};
  gGanttGlobal.PendingChanges = {};
  gGanttGlobal.BulkEditSelected = {};
  gGanttGlobal.suppressChangeTracking = false;
  gGanttGlobal.featureFlags = {};
  gGanttGlobal.ganttConfig = { highlightWeekends: false, highlightOrgHolidays: false, highlightNationalHolidays: false,
      highlightDueDates: false, highlightDueDateFlags: false, highlightShutdownDates: false, bulkEditEnabled: false };
  gGanttGlobal.adminConfiguration = {
    configurationScope: "USER", // USER = each user can maintain own config, CUSTOMER = one shared customer config
    administratorUsers: []
  };
  gGanttGlobal._usHolidayCache = {};
  gGanttGlobal._configuredHolidayCache = {};
  gGanttGlobal._shutdownDateCache = {};


  function getGridData(paramsObj) {
    var vGridDataList;
    var vClientRows = 0;
    var vCurrentCursorPosition = 0;
    var vGridDataLength = 0;
    var i = 0;
    var vMoreRecordsPresent = "-";

    // First call to the grid
    parent.EAM.Ajax.request({
      url: paramsObj.URL,
      params: {
        SYSTEM_FUNCTION_NAME: paramsObj["SYSTEM_FUNCTION_NAME"],
        USER_FUNCTION_NAME: paramsObj["USER_FUNCTION_NAME"], // Planning WO to display associated to the selected DSPY
        CURRENT_TAB_NAME: paramsObj["CURRENT_TAB_NAME"],
        COMPONENT_INFO_TYPE: "DATA_ONLY",

        REQUEST_TYPE: "LIST.HEAD_DATA.STORED",

        MADDON_FILTER_ALIAS_NAME_1: paramsObj["MADDON_FILTER_ALIAS_NAME_1"],
        MADDON_FILTER_OPERATOR_1: paramsObj["MADDON_FILTER_OPERATOR_1"],
        MADDON_FILTER_JOINER_1: paramsObj["MADDON_FILTER_JOINER_1"],
        MADDON_FILTER_SEQNUM_1: paramsObj["MADDON_FILTER_SEQNUM_1"],
        MADDON_FILTER_VALUE_1: paramsObj["MADDON_FILTER_VALUE_1"],

        MADDON_FILTER_ALIAS_NAME_2: paramsObj["MADDON_FILTER_ALIAS_NAME_2"],
        MADDON_FILTER_OPERATOR_2: paramsObj["MADDON_FILTER_OPERATOR_2"],
        MADDON_FILTER_JOINER_2: paramsObj["MADDON_FILTER_JOINER_2"],
        MADDON_FILTER_SEQNUM_2: paramsObj["MADDON_FILTER_SEQNUM_2"],
        MADDON_FILTER_VALUE_2: paramsObj["MADDON_FILTER_VALUE_2"],

        MADDON_FILTER_ALIAS_NAME_3: paramsObj["MADDON_FILTER_ALIAS_NAME_3"],
        MADDON_FILTER_OPERATOR_3: paramsObj["MADDON_FILTER_OPERATOR_3"],
        MADDON_FILTER_JOINER_3: paramsObj["MADDON_FILTER_JOINER_3"],
        MADDON_FILTER_SEQNUM_3: paramsObj["MADDON_FILTER_SEQNUM_3"],
        MADDON_FILTER_VALUE_3: paramsObj["MADDON_FILTER_VALUE_3"],
        GET_ALL_DATABSE_ROWS: true,
        GET_LAST_CACHED: false, //must be false otherwise the system will retrieve always the data from the last call of the datapsy even if the filter has changed
        CACHE_REQUEST: true,

        NUMBER_OF_ROWS_FIRST_RETURNED: 5000
      },
      async: false,
      onSuccess: function (vTrue, vResponseText, vList) {
        if (vList.pageData.grid.GRIDRESULT.GRID.DATA) {
          vGridDataList = null;
          vGridDataList = vList.pageData.grid.GRIDRESULT.GRID.DATA;
          vClientRows = vList.pageData.grid.GRIDRESULT.GRID.METADATA.CLIENTROWS;
          vCurrentCursorPosition = vList.pageData.grid.GRIDRESULT.GRID.METADATA.CURRENTCURSORPOSITION;
          vMoreRecordsPresent = vList.pageData.grid.GRIDRESULT.GRID.METADATA.MORERECORDPRESENT;
          vCurrentCursorPosition = Number(vCurrentCursorPosition) + 1;
        }
      } // end success

    });
    // Loop on grid call until no more record present
    while (vMoreRecordsPresent == "+") {
      parent.EAM.Ajax.request({
        url: "GETCACHE",
        params: {
          SYSTEM_FUNCTION_NAME: paramsObj["SYSTEM_FUNCTION_NAME"],
          USER_FUNCTION_NAME: paramsObj["USER_FUNCTION_NAME"], // Planning WO to display associated to the selected DSPY
          COMPONENT_INFO_TYPE: "DATA_ONLY",
          COMPONENT_INFO_TYPE_MODE: "CACHE",

          REQUEST_TYPE: "LIST.HEAD_DATA.STORED",

          CACHE_REQUEST: false,
          CURSOR_POSITION: vCurrentCursorPosition,
          NUMBER_OF_ROWS_FIRST_RETURNED: vClientRows,
          MADDON_FILTER_ALIAS_NAME_1: paramsObj["MADDON_FILTER_ALIAS_NAME_1"],
          MADDON_FILTER_OPERATOR_1: paramsObj["MADDON_FILTER_OPERATOR_1"],
          MADDON_FILTER_JOINER_1: paramsObj["MADDON_FILTER_JOINER_1"],
          MADDON_FILTER_SEQNUM_1: paramsObj["MADDON_FILTER_SEQNUM_1"],
          MADDON_FILTER_VALUE_1: paramsObj["MADDON_FILTER_VALUE_1"],

          MADDON_FILTER_ALIAS_NAME_2: paramsObj["MADDON_FILTER_ALIAS_NAME_2"],
          MADDON_FILTER_OPERATOR_2: paramsObj["MADDON_FILTER_OPERATOR_2"],
          MADDON_FILTER_JOINER_2: paramsObj["MADDON_FILTER_JOINER_2"],
          MADDON_FILTER_SEQNUM_2: paramsObj["MADDON_FILTER_SEQNUM_2"],
          MADDON_FILTER_VALUE_2: paramsObj["MADDON_FILTER_VALUE_2"],

          MADDON_FILTER_ALIAS_NAME_3: paramsObj["MADDON_FILTER_ALIAS_NAME_3"],
          MADDON_FILTER_OPERATOR_3: paramsObj["MADDON_FILTER_OPERATOR_3"],
          MADDON_FILTER_JOINER_3: paramsObj["MADDON_FILTER_JOINER_3"],
          MADDON_FILTER_SEQNUM_3: paramsObj["MADDON_FILTER_SEQNUM_3"],
          MADDON_FILTER_VALUE_3: paramsObj["MADDON_FILTER_VALUE_3"],
          USE_PAGING: true
        },
        async: false,
        onSuccess: function (vTrue, vResponseText, vList) {
          if (vList.pageData.grid.GRIDRESULT.GRID.DATA) {
            vGridDataLength = vList.pageData.grid.GRIDRESULT.GRID.DATA.length;
            for (i = 0; i < vGridDataLength; i++) {
              vGridDataList.push(vList.pageData.grid.GRIDRESULT.GRID.DATA[i]);
            }
            vClientRows = vList.pageData.grid.GRIDRESULT.GRID.METADATA.CLIENTROWS;
            vCurrentCursorPosition = vList.pageData.grid.GRIDRESULT.GRID.METADATA.CURRENTCURSORPOSITION;
            vMoreRecordsPresent = vList.pageData.grid.GRIDRESULT.GRID.METADATA.MORERECORDPRESENT;
            vCurrentCursorPosition = Number(vCurrentCursorPosition) + 1;
            //parseobj(); //
          }
        } // end success
      });
    } //while loop
    return vGridDataList;
  }

  function createEmptyGanttConfigurationJson() {
    return {
      name: "Configuration JSON",
      version: 1,
      adminConfiguration: { configurationScope: "USER", administratorUsers: [] },
      features: {},
      license: [],
      columns: { SELECT: [], DSELECT: [] },
      colors: [],
      shiftColors: [],
      dayScale: {},
      experience: {},
      usHolidays: [],
      organizationHolidays: [],
      organizationSpecialDays: [],
      dataspy: [],
      lookups: {}
    };
  }

  function getDefaultDayScaleConfiguration() {
    return {
      dateFormat: "%d %M",
      showEstimatedHours: true,
      minColumnWidth: 80,
      scaleHeight: 65
    };
  }

  function normalizeAdminConfiguration(adminConfig, fallbackAdminConfig) {
    var fallback = fallbackAdminConfig || {};
    var source = adminConfig || {};
    var scope = String(source.configurationScope || fallback.configurationScope || "USER").toUpperCase();
    if (scope !== "CUSTOMER") scope = "USER";
    var admins = source.administratorUsers || fallback.administratorUsers || [];
    if (!Ext.isArray(admins)) admins = [admins];
    admins = admins.filter(function(user) { return !Ext.isEmpty(user); }).map(function(user) { return String(user); });
    return {
      configurationScope: scope,
      administratorUsers: admins
    };
  }

  function getDefaultExperienceConfiguration() {
    return {
      gridWidthPercent: 26,
      tooltipDelayMs: 350,
      timelineHighlightField: "EVT_UDFDATE01",
      alternateGanttRows: false,
      resourceOverloadThresholdHours: 8,
      taskTextMode: "DESCRIPTION",
      readonlyStatuses: ["FWD", "FWP", "FWM"],
      rowDensity: "COMFORTABLE",
      taskBarMinWidth: 0
    };
  }

  function normalizeExperienceConfiguration(experience) {
    var defaults = getDefaultExperienceConfiguration();
    experience = experience || {};

    var gridWidthPercent = parseInt(experience.gridWidthPercent, 10);
    if (isNaN(gridWidthPercent)) gridWidthPercent = defaults.gridWidthPercent;
    gridWidthPercent = Math.max(15, Math.min(40, gridWidthPercent));

    var tooltipDelayMs = parseInt(experience.tooltipDelayMs, 10);
    if (isNaN(tooltipDelayMs)) tooltipDelayMs = defaults.tooltipDelayMs;
    tooltipDelayMs = Math.max(0, Math.min(1500, tooltipDelayMs));

    var timelineHighlightField = String(experience.timelineHighlightField || defaults.timelineHighlightField).toUpperCase();
    if (!/^EVT_[A-Z0-9_]+$/.test(timelineHighlightField)) timelineHighlightField = defaults.timelineHighlightField;

    var overloadThreshold = parseFloat(experience.resourceOverloadThresholdHours);
    if (isNaN(overloadThreshold)) overloadThreshold = defaults.resourceOverloadThresholdHours;
    overloadThreshold = Math.max(1, Math.min(24, overloadThreshold));

    var taskTextMode = String(experience.taskTextMode || defaults.taskTextMode).toUpperCase();
    if (["WO", "DESCRIPTION", "WO_DESCRIPTION", "EQUIPMENT", "TRADE"].indexOf(taskTextMode) === -1) taskTextMode = defaults.taskTextMode;

    var readonlyStatuses = experience.readonlyStatuses || defaults.readonlyStatuses;
    if (!Ext.isArray(readonlyStatuses)) readonlyStatuses = String(readonlyStatuses || "").split(",");
    readonlyStatuses = readonlyStatuses.map(function(status) {
      return String(status || "").toUpperCase().trim();
    }).filter(function(status) {
      return status.length > 0;
    });

    var rowDensity = String(experience.rowDensity || defaults.rowDensity).toUpperCase();
    if (["COMPACT", "COMFORTABLE"].indexOf(rowDensity) === -1) rowDensity = defaults.rowDensity;

    var taskBarMinWidth = parseInt(experience.taskBarMinWidth, 10);
    if (isNaN(taskBarMinWidth)) taskBarMinWidth = defaults.taskBarMinWidth;
    taskBarMinWidth = Math.max(0, Math.min(160, taskBarMinWidth));

    return {
      gridWidthPercent: gridWidthPercent,
      tooltipDelayMs: tooltipDelayMs,
      timelineHighlightField: timelineHighlightField,
      alternateGanttRows: normalizeFeatureFlagValue(experience.alternateGanttRows, defaults.alternateGanttRows),
      resourceOverloadThresholdHours: overloadThreshold,
      taskTextMode: taskTextMode,
      readonlyStatuses: readonlyStatuses,
      rowDensity: rowDensity,
      taskBarMinWidth: taskBarMinWidth
    };
  }

  function getDefaultHolidayConfiguration() {
    return {
      usHolidays: [
        { code: "NEW_YEAR_2026", value: "2026-01-01", description: "New Year's Day", type: "US_HOLIDAY" },
        { code: "MEMORIAL_DAY_2026", value: "2026-05-25", description: "Memorial Day", type: "US_HOLIDAY" },
        { code: "INDEPENDENCE_DAY_2026", value: "2026-07-03", description: "Independence Day Observed", type: "US_HOLIDAY" },
        { code: "THANKSGIVING_2026", value: "2026-11-26", description: "Thanksgiving Day", type: "US_HOLIDAY" },
        { code: "CHRISTMAS_2026", value: "2026-12-25", description: "Christmas Day", type: "US_HOLIDAY" }
      ],
      organizationHolidays: [
        { code: "ORG_SHUTDOWN_2026_07_06", value: "2026-07-06", description: "Organization Shutdown", type: "ORG_HOLIDAY" },
        { code: "ORG_MAINT_DAY_2026_09_04", value: "2026-09-04", description: "Plant Holiday", type: "ORG_HOLIDAY" }
      ],
      organizationSpecialDays: [
        { code: "CUSTOMER_AUDIT_2026_06_15", value: "2026-06-15", description: "Customer Audit Day", type: "ORG_SPECIAL_DAY" },
        { code: "SAFETY_DAY_2026_10_12", value: "2026-10-12", description: "Safety Stand-down", type: "ORG_SPECIAL_DAY" }
      ]
    };
  }

  function normalizeConfiguredDateList(items, type, fallbackItems) {
    var source = Ext.isArray(items) ? items : fallbackItems || [];
    return (source || []).filter(function(item) {
      return item && !Ext.isEmpty(item.value);
    }).map(function(item, index) {
      var value = String(item.value).split("T")[0];
      return {
        code: item.code || (type + "_" + (index + 1)),
        value: value,
        description: item.description || item.label || item.name || item.code || value,
        type: item.type || type
      };
    });
  }

  function applyAdminConfigurationFromDefaultConfig(defaultConfig) {
    gGanttGlobal.adminConfiguration = normalizeAdminConfiguration(defaultConfig && defaultConfig.adminConfiguration, gGanttGlobal.adminConfiguration);
  }

  function normalizeFeatureFlagValue(value, fallback) {
    if (value === true || value === false) return value;
    if (typeof value === "string") {
      var text = value.toLowerCase();
      if (text === "true" || text === "+" || text === "yes" || text === "1" || text === "on") return true;
      if (text === "false" || text === "-" || text === "no" || text === "0" || text === "off") return false;
    }
    return fallback;
  }

  var IUX_FEATURE_FLAG_KEYS = ["analytics", "bulkEdit", "summary", "shiftPopup", "excelDownload", "resourcesPanel"];
  var IUX_FEATURE_CIPHER_KEY = "IUXHUB:GANTT:FEATURES:v1";

  function iuxFeatureChecksum(text) {
    var hash = 2166136261;
    text = String(text || "");
    for (var i = 0; i < text.length; i++) {
      hash ^= text.charCodeAt(i);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return ("00000000" + (hash >>> 0).toString(16)).slice(-8);
  }

  function iuxFeatureBase64Decode(text) {
    return decodeURIComponent(escape(atob(String(text || ""))));
  }

  function iuxFeatureXor(text) {
    var output = "";
    text = String(text || "");
    for (var i = 0; i < text.length; i++) {
      output += String.fromCharCode(text.charCodeAt(i) ^ IUX_FEATURE_CIPHER_KEY.charCodeAt(i % IUX_FEATURE_CIPHER_KEY.length));
    }
    return output;
  }

  function decodeFeatureFlagsFromConfig(cipherText) {
    if (Ext.isEmpty(cipherText)) return null;
    var parts = String(cipherText).split(".");
    if (parts.length !== 3 || parts[0] !== "v1") return null;
    var payload = iuxFeatureXor(iuxFeatureBase64Decode(parts[2]));
    var checksum = iuxFeatureChecksum(IUX_FEATURE_CIPHER_KEY + "|" + payload);
    if (checksum !== parts[1]) {
      console.warn("Feature flag configuration checksum mismatch.");
      return null;
    }
    return JSON.parse(payload);
  }

  function getConfigurationFeatureFlags(config) {
    if (config && !Ext.isEmpty(config.featuresCipher)) {
      var decoded = decodeFeatureFlagsFromConfig(config.featuresCipher);
      if (decoded) return decoded;
      return {};
    }
    if (config && typeof config.features === "string") {
      var decodedFeatures = decodeFeatureFlagsFromConfig(config.features);
      if (decodedFeatures) return decodedFeatures;
      return {};
    }
    return config && config.features;
  }

  function normalizeFeatureFlags(features, fallbackFeatures) {
    var fallback = fallbackFeatures || {};
    var source = features || {};
    var normalized = {};
    IUX_FEATURE_FLAG_KEYS.forEach(function(key) {
      var fallbackValue = normalizeFeatureFlagValue(fallback[key], false);
      normalized[key] = normalizeFeatureFlagValue(source[key], fallbackValue);
    });
    return normalized;
  }

  function applyFeatureFlags(config) {
    gGanttGlobal.featureFlags = normalizeFeatureFlags(getConfigurationFeatureFlags(config));
    if (!gGanttGlobal.featureFlags.bulkEdit) {
      gGanttGlobal.ganttConfig.bulkEditEnabled = false;
      gGanttGlobal.BulkEditSelected = {};
    }
  }

  function isFeatureEnabled(featureName) {
    var flags = gGanttGlobal.featureFlags || {};
    return flags[featureName] === true;
  }

  function cloneJsonObject(value) {
    return JSON.parse(JSON.stringify(value || {}));
  }

  function normalizeGanttConfigurationJson(config) {
    config = config || createEmptyGanttConfigurationJson();
    config.name = config.name || "Configuration JSON";
    config.version = config.version || 1;
    config.adminConfiguration = normalizeAdminConfiguration(config.adminConfiguration, gGanttGlobal.adminConfiguration);
    config.features = normalizeFeatureFlags(getConfigurationFeatureFlags(config));
    config.license = config.license || [];
    config.columns = config.columns || {};
    config.columns.SELECT = config.columns.SELECT || [];
    config.columns.DSELECT = config.columns.DSELECT || [];
    config.colors = config.colors || [];
    config.shiftColors = config.shiftColors || [];
    config.dayScale = config.dayScale || {};
    var defaultDayScale = getDefaultDayScaleConfiguration();
    config.dayScale.dateFormat = config.dayScale.dateFormat || defaultDayScale.dateFormat;
    config.dayScale.showEstimatedHours = config.dayScale.showEstimatedHours !== false;
    config.dayScale.minColumnWidth = parseInt(config.dayScale.minColumnWidth, 10);
    config.dayScale.scaleHeight = defaultDayScale.scaleHeight;
    if (isNaN(config.dayScale.minColumnWidth) || config.dayScale.minColumnWidth < 40) config.dayScale.minColumnWidth = defaultDayScale.minColumnWidth;
    config.experience = normalizeExperienceConfiguration(config.experience);
    var defaultHolidayConfig = getDefaultHolidayConfiguration();
    config.usHolidays = normalizeConfiguredDateList(config.usHolidays, "US_HOLIDAY", defaultHolidayConfig.usHolidays);
    config.organizationHolidays = normalizeConfiguredDateList(config.organizationHolidays, "ORG_HOLIDAY", defaultHolidayConfig.organizationHolidays);
    config.organizationSpecialDays = normalizeConfiguredDateList(config.organizationSpecialDays, "ORG_SPECIAL_DAY", defaultHolidayConfig.organizationSpecialDays);
    config.dataspy = config.dataspy || [];
    config.lookups = config.lookups || {};
    return config;
  }

  function protectConfigurationJsonForStorage(config) {
    var storageConfig = normalizeGanttConfigurationJson(cloneJsonObject(config));
    if (config && !Ext.isEmpty(config.featuresCipher)) storageConfig.featuresCipher = config.featuresCipher;
    else if (config && typeof config.features === "string") storageConfig.featuresCipher = config.features;
    delete storageConfig.features;
    return storageConfig;
  }

  function buildConfigurationOverrideForStorage(config) {
    config = normalizeGanttConfigurationJson(cloneJsonObject(config));
    return {
      name: "Configuration Override",
      version: config.version || 1,
      columns: cloneJsonObject(config.columns || { SELECT: [], DSELECT: [] }),
      colors: cloneJsonObject(config.colors || []),
      shiftColors: cloneJsonObject(config.shiftColors || []),
      dayScale: cloneJsonObject(config.dayScale || {}),
      experience: cloneJsonObject(config.experience || {}),
      usHolidays: cloneJsonObject(config.usHolidays || []),
      organizationHolidays: cloneJsonObject(config.organizationHolidays || []),
      organizationSpecialDays: cloneJsonObject(config.organizationSpecialDays || [])
    };
  }

  function mergeConfigurationOverride(defaultConfig, overrideConfig) {
    var merged = normalizeGanttConfigurationJson(cloneJsonObject(defaultConfig || createEmptyGanttConfigurationJson()));
    overrideConfig = overrideConfig || {};

    if (overrideConfig.columns) {
      merged.columns = cloneJsonObject(overrideConfig.columns);
      merged.columns.SELECT = merged.columns.SELECT || [];
      merged.columns.DSELECT = merged.columns.DSELECT || [];
    }
    if (overrideConfig.colors) merged.colors = cloneJsonObject(overrideConfig.colors);
    if (overrideConfig.shiftColors) merged.shiftColors = cloneJsonObject(overrideConfig.shiftColors);
    if (overrideConfig.dayScale) merged.dayScale = cloneJsonObject(overrideConfig.dayScale);
    if (overrideConfig.experience) merged.experience = cloneJsonObject(overrideConfig.experience);
    if (overrideConfig.usHolidays) merged.usHolidays = cloneJsonObject(overrideConfig.usHolidays);
    if (overrideConfig.organizationHolidays) merged.organizationHolidays = cloneJsonObject(overrideConfig.organizationHolidays);
    if (overrideConfig.organizationSpecialDays) merged.organizationSpecialDays = cloneJsonObject(overrideConfig.organizationSpecialDays);

    return normalizeGanttConfigurationJson(merged);
  }

  function flattenGanttConfigurationJson(config) {
    config = normalizeGanttConfigurationJson(config);
    var rows = [];
    function addRows(items, type) {
      (items || []).forEach(function(item) {
        rows.push({
          cfg_code: item.code,
          cfg_value: item.value,
          cfg_type: item.type || type,
          cfg_property: item.property || "",
          cfg_viewtype: item.viewType || ""
        });
      });
    }

    addRows(config.license, "LICENSE");
    addRows(config.columns && config.columns.SELECT, "SELECT");
    addRows(config.columns && config.columns.DSELECT, "DSELECT");
    addRows(config.colors, "COLOR");
    addRows(config.shiftColors, "SHIFT_CLR");
    addRows(config.usHolidays, "US_HOLIDAY");
    addRows(config.organizationHolidays, "ORG_HOLIDAY");
    addRows(config.organizationSpecialDays, "ORG_SPECIAL_DAY");
    addRows(config.dataspy, "DATASPY");

    Object.keys(config.lookups || {}).forEach(function(type) {
      addRows(config.lookups[type], type);
    });

    return rows;
  }

  function isJsonManagedConfigurationType(type) {
    var cfgType = String(type || "").toUpperCase();
    return cfgType === "LICENSE" ||
           cfgType === "SELECT" ||
           cfgType === "DSELECT" ||
           cfgType === "COLOR" ||
           cfgType === "SHIFT_CLR" ||
           cfgType === "US_HOLIDAY" ||
           cfgType === "ORG_HOLIDAY" ||
           cfgType === "ORG_SPECIAL_DAY" ||
           cfgType === "DATASPY";
  }

  function mergeInitialConfigurationRows(legacyRows, jsonRows) {
    var merged = [];
    (legacyRows || []).forEach(function(row) {
      if (!row || isJsonManagedConfigurationType(row.cfg_type || row.CFG_TYPE)) return;
      merged.push(row);
    });
    return merged.concat(jsonRows || []);
  }

  var GanttDataAccess = {
    sessionFunction: {
      system: 'BSUDSC',
      user: 'IUSESS',
      listTab: 'LST',
      headerTab: 'HDR',
      grid: 'IUSESS'
    },

    buildUserQueryPayload: function(recordType, recordId) {
      var params = collectUserQuery();
      params.SYSTEM_FUNCTION_NAME = this.sessionFunction.system;
      params.USER_FUNCTION_NAME = this.sessionFunction.user;
      params.CURRENT_TAB_NAME = this.sessionFunction.headerTab;
      params.wspf_10_crr_type = recordType;
      if (!Ext.isEmpty(recordId)) params.wspf_10_crr_id = recordId;
      return params;
    },

    findSessionRecords: function(recordId) {
      return EAM.Ajax.request({
        url: this.sessionFunction.system + ".xmlhttp",
        params: {
          GRID_NAME: this.sessionFunction.grid,
          MADDON_FILTER_ALIAS_NAME_1: 'wspf_10_crr_id',
          MADDON_FILTER_OPERATOR_1: 'BEGINS',
          MADDON_FILTER_JOINER_1: 'AND',
          MADDON_FILTER_SEQNUM_1: '1',
          MADDON_FILTER_VALUE_1: recordId,
          MADDON_LPAREN_1: false,
          MADDON_RPAREN_1: false,
          USER_FUNCTION_NAME: this.sessionFunction.user,
          SYSTEM_FUNCTION_NAME: this.sessionFunction.system,
          CURRENT_TAB_NAME: this.sessionFunction.listTab,
          COMPONENT_INFO_TYPE: 'DATA_ONLY'
        }
      }).responseData.pageData.grid.GRIDRESULT.GRID.DATA;
    },

    findConfigurationRecords: function() {
      return EAM.Ajax.request({
        url: this.sessionFunction.system + ".xmlhttp",
        params: { 
          GRID_NAME: this.sessionFunction.grid, 
          MADDON_FILTER_ALIAS_NAME_1: 'wspf_10_crr_type',
          MADDON_FILTER_OPERATOR_1: 'CONTAINS',
          MADDON_FILTER_JOINER_1: 'AND',
          MADDON_FILTER_SEQNUM_1: '1',
          MADDON_FILTER_VALUE_1: 'CONFIGURATION',
          MADDON_LPAREN_1: false,
          MADDON_RPAREN_1: false,
          USER_FUNCTION_NAME: this.sessionFunction.user,
          SYSTEM_FUNCTION_NAME: this.sessionFunction.system,
          CURRENT_TAB_NAME: this.sessionFunction.listTab,
          COMPONENT_INFO_TYPE: 'DATA_ONLY'
        }
      }).responseData.pageData.grid.GRIDRESULT.GRID.DATA;
    },

    findRecordIdInRows: function(rows, recordId) {
      var target = String(recordId || "").toUpperCase();
      for (var i = 0; i < (rows || []).length; i++) {
        var rowId = String(rows[i].wspf_10_crr_id || rows[i].WSPF_10_CRR_ID || "");
        if (rowId.toUpperCase() === target) return rowId;
      }
      return "";
    },

    getSessionRecordValue: function(record) {
      if (!record) return "";
      return record.wspf_10_crr_data || record.WSPF_10_CRR_DATA ||
             record.wspf_10_crr_sql || record.WSPF_10_CRR_SQL ||
             record.description || record.DESCRIPTION ||
             record.cfg_value || record.CFG_VALUE || "";
    },

    loadSessionHeader: function(recordId) {
      return EAM.Ajax.request({
        url: this.sessionFunction.system + "." + this.sessionFunction.headerTab,
        params: {
          SYSTEM_FUNCTION_NAME: this.sessionFunction.system,
          USER_FUNCTION_NAME: this.sessionFunction.user,
          CURRENT_TAB_NAME: this.sessionFunction.headerTab,
          wspf_10_crr_id: recordId,
          reset_pageaction: "RESET",
          pagemode: "view",
          pageaction: "",
          SCROLLROW: "YES"
        }
      }).responseData.pageData.values;
    },

    deleteSessionRecord: function(recordId) {
      var existing = this.findSessionRecords(recordId);
      if (Ext.isEmpty(existing) || existing.length === 0) return false;

      var record = this.loadSessionHeader(recordId);
      record.processaction = 'delete';
      record.pagemode = 'delete';
      record.can_insert = '';
      record.can_update = '';
      record.can_delete = '';
      record.PKID = '';

      EAM.Ajax.request({
        url: this.sessionFunction.system + "." + this.sessionFunction.headerTab + ".deleterecord?pageaction=DELETE",
        params: Ext.merge(record, {
          SYSTEM_FUNCTION_NAME: this.sessionFunction.system,
          USER_FUNCTION_NAME: this.sessionFunction.user,
          CURRENT_TAB_NAME: this.sessionFunction.headerTab
        })
      });
      return true;
    },

    insertSessionRecord: function(params) {
      var template = EAM.Ajax.request({
        url: this.sessionFunction.system + "." + this.sessionFunction.headerTab,
        params: {
          SYSTEM_FUNCTION_NAME: params.SYSTEM_FUNCTION_NAME,
          USER_FUNCTION_NAME: params.USER_FUNCTION_NAME,
          CURRENT_TAB_NAME: params.CURRENT_TAB_NAME,
          ONLY_DATA_REQUIRED: true,
          SCROLLROW: "YES",
          wspf_10_crr_id: ""
        }
      }).responseData.pageData.values;

      template.pagemode = "view";
      template.recordid = "";
      template.processaction = "insert";
      template.CHECK_CF_CHANGEFLAG = "true";
      template.webservicepromptcode = params.USER_FUNCTION_NAME;
      template.can_update = "";
      template.can_insert = "";
      template.can_delete = "";

      return EAM.Ajax.request({
        url: this.sessionFunction.system + "." + this.sessionFunction.headerTab + ".insertrecord?pageaction=SAVE",
        params: Ext.merge(template, params)
      }).responseData.pageData.values;
    },

    saveSessionQuery: function() {
      var inserted = this.insertSessionRecord(this.buildUserQueryPayload("SESSION"));
      var recordId = inserted && (inserted.wspf_10_crr_id || inserted.WSPF_10_CRR_ID);
      if (Ext.isEmpty(recordId)) return inserted;

      try {
        return this.loadSessionHeader(recordId);
      } catch (e) {
        console.warn("Unable to reload generated SESSION data. Using insert response.", e);
        return inserted;
      }
    },

    getConfigurationRecordIds: function() {
      var isCustomerConfig = gGanttGlobal.adminConfiguration &&
        String(gGanttGlobal.adminConfiguration.configurationScope || "USER").toUpperCase() === "CUSTOMER";
      return {
        user: isCustomerConfig ? "CUSTOMER_GANTT_CONFIGURATION_JSON" : "USER_GANTT_CONFIGURATION_JSON",
        default: "DEFAULT_GANTT_CONFIGURATION_JSON"
      };
    },

    loadConfigurationRecord: function(recordId) {
      var record = this.loadSessionHeader(recordId);
      var rawJson = this.getSessionRecordValue(record);
      if (Ext.isEmpty(rawJson)) return null;
      return JSON.parse(rawJson);
    },

    loadDefaultConfigurationRecordDirect: function(rows) {
      var defaultRecordId = this.findRecordIdInRows(rows || [], "DEFAULT_GANTT_CONFIGURATION_JSON");
      return this.loadConfigurationRecord(defaultRecordId || "DEFAULT_GANTT_CONFIGURATION_JSON");
    },

    loadDefaultConfigurationJson: function(legacyRows) {
      var rows = [];
      var defaultConfig = null;
      try {
        rows = this.findConfigurationRecords() || [];
      } catch (e) {
        console.warn("Unable to retrieve Configuration rows from IUSESS.", e);
      }
      try {
        defaultConfig = this.loadDefaultConfigurationRecordDirect(rows);
      } catch (e) {
        console.warn("Unable to load DEFAULT_GANTT_CONFIGURATION_JSON.", e);
        throw new Error("DEFAULT_GANTT_CONFIGURATION_JSON is required.");
      }
      applyAdminConfigurationFromDefaultConfig(defaultConfig);
      return normalizeGanttConfigurationJson(defaultConfig);
    },

    loadConfigurationJson: function(legacyRows) {
      var rows = [];
      var config = null;
      var defaultConfig = null;
      try {
        rows = this.findConfigurationRecords() || [];
      } catch (e) {
        console.warn("Unable to retrieve Configuration rows from IUSESS.", e);
      }
      try {
        defaultConfig = this.loadDefaultConfigurationRecordDirect(rows);
        applyAdminConfigurationFromDefaultConfig(defaultConfig);
      } catch (e) {
        console.warn("Unable to load DEFAULT_GANTT_CONFIGURATION_JSON.", e);
        throw new Error("DEFAULT_GANTT_CONFIGURATION_JSON is required.");
      }
      var recordIds = this.getConfigurationRecordIds();
      try {
        var userRecordId = this.findRecordIdInRows(rows, recordIds.user);
        var userConfig = userRecordId ? this.loadConfigurationRecord(userRecordId) : null;
        if (userConfig) {
          config = mergeConfigurationOverride(defaultConfig, userConfig);
          gGanttGlobal.ConfigurationJson = cloneJsonObject(config);
          applyFeatureFlags(config);
          return config;
        }
      } catch (e) {
        console.warn("Unable to load user Configuration JSON. Falling back to default.", e);
      }
      try {
        if (defaultConfig) {
          applyAdminConfigurationFromDefaultConfig(defaultConfig);
          config = normalizeGanttConfigurationJson(defaultConfig);
          gGanttGlobal.ConfigurationJson = cloneJsonObject(config);
          applyFeatureFlags(config);
          return config;
        }
      } catch (e) {
        console.warn("Unable to load default Configuration JSON.", e);
      }
      throw new Error("DEFAULT_GANTT_CONFIGURATION_JSON is required.");
    },

    saveConfigurationJson: function(configJson, scope) {
      if (!configJson) {
        throw new Error("Configuration JSON is required for saveConfigurationJson.");
      }
      var recordIds = this.getConfigurationRecordIds();
      var recordId = (scope === "USER") ? recordIds.user : recordIds.default;
      this.deleteSessionRecord(recordId);
      var params = this.buildUserQueryPayload("CONFIGURATION", recordId);
      params.wspf_10_crr_data = JSON.stringify(scope === "USER" ? buildConfigurationOverrideForStorage(configJson) : protectConfigurationJsonForStorage(configJson));
      params.wspf_10_crr_sql = "";
      return this.insertSessionRecord(params);
    },

    deleteConfigurationOverride: function() {
      var recordIds = this.getConfigurationRecordIds();
      return this.deleteSessionRecord(recordIds.user);
    },

    loadInitialConfigurations: function() {
      var legacyRows = this.loadLegacyInitialConfigurations();
      return mergeInitialConfigurationRows(legacyRows, flattenGanttConfigurationJson(this.loadConfigurationJson(legacyRows)));
    },

    loadLegacyInitialConfigurations: function() {
      var paramsObj = {
        URL: "GRIDDATA",
        SYSTEM_FUNCTION_NAME: "IUCONG",
        USER_FUNCTION_NAME: "IUCONG",
        GET_ALL_DATABSE_ROWS: true,
        GET_LAST_CACHED: false,
        CACHE_REQUEST: false,
        GRID_NAME: "IUCONG",
        COMPONENT_INFO_TYPE: "DATA_ONLY",
        NUMBER_OF_ROWS_FIRST_RETURNED: 1000
      };
      return getGridData(paramsObj) || [];
    },

    loadJavaSource: function(name) {
      return EAM.Ajax.request({
        url: "BSJAVA.HDR",
        params: {
          SYSTEM_FUNCTION_NAME: "BSJAVA",
          USER_FUNCTION_NAME: "IEGANT",
          CURRENT_TAB_NAME: "HDR",
          name: name,
          reset_pageaction: "RESET",
          pagemode: "view",
          pageaction: "",
          SCROLLROW: "YES"
        }
      }).responseData.pageData.values.sourcecode;
    }
  };

  function getDefaultStartDate() {
    return normalizeGanttDateStart(new Date());
  }

  function getFirstDataSpyValue() {
    var store = gGanttGlobal.DataSpyStore;
    if (!store) return "";
    if (store.getCount && store.getCount() > 0 && store.getAt) {
      var record = store.getAt(0);
      return record && record.get ? record.get("code") : "";
    }
    if (store.data && store.data.items && store.data.items.length) {
      var item = store.data.items[0];
      return item && item.get ? item.get("code") : "";
    }
    return "";
  }

  function normalizeGanttDateStart(value) {
    var date = value instanceof Date ? new Date(value) : new Date(value);
    if (isNaN(date.getTime())) return date;
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  }

  function getZoomLevelName(value) {
    var zoomValue = String(Ext.isEmpty(value) ? "day" : value).toLowerCase();
    var numericMap = { "0": "day", "1": "day", "2": "week", "3": "month", "4": "quarter", "5": "year" };
    if (numericMap[zoomValue]) return numericMap[zoomValue];
    if (["day", "week", "month", "quarter", "year"].indexOf(zoomValue) !== -1) return zoomValue;
    return "day";
  }

  function getCurrentZoomLevelName() {
    if (typeof gantt === 'undefined' || !gantt.ext || !gantt.ext.zoom) return "day";
    var currentLevel = gantt.ext.zoom.getCurrentLevel();
    if (typeof currentLevel === "number") {
      return ["day", "week", "month", "quarter", "year"][currentLevel] || "day";
    }
    return getZoomLevelName(currentLevel);
  }

  function getZoomLevelLabel(value) {
    var labels = { day: "Day", week: "Week", month: "Month", quarter: "Quarter", year: "Year" };
    return labels[getZoomLevelName(value)] || "Day";
  }

  function formatTimelineScaleDateKey(date) {
    return date.getFullYear() + '-' + ("0" + (date.getMonth() + 1)).slice(-2) + '-' + ("0" + date.getDate()).slice(-2);
  }

  function renderClickableTimelineDate(date, label) {
    return '<span class="iux-timeline-date-link" data-iux-scale-date="' + formatTimelineScaleDateKey(date) + '" title="View work orders scheduled on this date">' + label + '</span>';
  }

  function getConfiguredDayScale() {
    return normalizeGanttConfigurationJson(gGanttGlobal.ConfigurationJson || createEmptyGanttConfigurationJson()).dayScale;
  }

  function applyDayScaleConfigurationToZoomConfig() {
    if (!zoomConfig || !zoomConfig.levels || !zoomConfig.levels.length) return;
    var dayScale = getConfiguredDayScale();
    for (var i = 0; i < zoomConfig.levels.length; i++) {
      if (zoomConfig.levels[i].name === "day") {
        zoomConfig.levels[i].scale_height = dayScale.scaleHeight;
        zoomConfig.levels[i].min_column_width = dayScale.minColumnWidth;
        break;
      }
    }
  }

  function isSearchSuccess(id, task) {
    var selection = Ext.getCmp('searchgantt');
    var searchVal = selection.value ? selection.value.toUpperCase() : '';

    // First check search box
    if (searchVal 
           && !(task.EVT_CLASS ? task.EVT_CLASS : '').toUpperCase().indexOf(searchVal) > -1
           && !(task.EVT_CODE ? task.EVT_CODE : '').toUpperCase().indexOf(searchVal) > -1
           && !(task.EVT_DESC ? task.EVT_DESC : '').toUpperCase().indexOf(searchVal) > -1
           && !(task.EVT_JOBTYPE ? task.EVT_JOBTYPE : '').toUpperCase().indexOf(searchVal) > -1
           && !(task.EVT_LOCATION ? task.EVT_LOCATION : '').toUpperCase().indexOf(searchVal) > -1
           && !(task.EVT_METUOM ? task.EVT_METUOM : '').toUpperCase().indexOf(searchVal) > -1
           && !(task.EVT_MRC ? task.EVT_MRC : '').toUpperCase().indexOf(searchVal) > -1
           && !(task.EVT_OBJECT ? task.EVT_OBJECT : '').toUpperCase().indexOf(searchVal) > -1
           && !(task.EVT_OBJECT_ORG ? task.EVT_OBJECT_ORG : '').toUpperCase().indexOf(searchVal) > -1 
           && !(task.EVT_OBTYPE ? task.EVT_OBTYPE : '').toUpperCase().indexOf(searchVal) > -1
           && !(task.EVT_ORG ? task.EVT_ORG : '').toUpperCase().indexOf(searchVal) > -1
           && !(task.EVT_PERSON ? task.EVT_PERSON : '').toUpperCase().indexOf(searchVal) > -1
           && !(task.EVT_PPM ? task.EVT_PPM : '').toUpperCase().indexOf(searchVal) > -1
           && !(task.EVT_PRIORITY ? task.EVT_PRIORITY : '').toUpperCase().indexOf(searchVal) > -1
           && !(task.EVT_PROJECT ? task.EVT_PROJECT : '').toUpperCase().indexOf(searchVal) > -1
           && !(task.EVT_RSTATUS ? task.EVT_RSTATUS : '').toUpperCase().indexOf(searchVal) > -1
           && !(task.EVT_RTYPE ? task.EVT_RTYPE : '').toUpperCase().indexOf(searchVal) > -1
           && !(task.EVT_SCHEDGRP ? task.EVT_SCHEDGRP : '').toUpperCase().indexOf(searchVal) > -1
           && !(task.EVT_STATUS ? task.EVT_STATUS : '').toUpperCase().indexOf(searchVal) > -1
           && !(task.EVT_UDFCHAR01 ? task.EVT_UDFCHAR01 : '').toUpperCase().indexOf(searchVal) > -1
           && !(task.EVT_UDFCHAR02 ? task.EVT_UDFCHAR02 : '').toUpperCase().indexOf(searchVal) > -1
           && !(task.EVT_UDFCHAR03 ? task.EVT_UDFCHAR03 : '').toUpperCase().indexOf(searchVal) > -1
           && !(task.EVT_UDFCHAR04 ? task.EVT_UDFCHAR04 : '').toUpperCase().indexOf(searchVal) > -1
           && !(task.EVT_UDFCHAR05 ? task.EVT_UDFCHAR05 : '').toUpperCase().indexOf(searchVal) > -1
           && !(task.LISTOFTRADES ? task.LISTOFTRADES : '').toUpperCase().indexOf(searchVal) > -1
           && !(task.OBJ_DESC ? task.OBJ_DESC : '').toUpperCase().indexOf(searchVal) > -1 
           && !(task.OBJ_LOCATION ? task.OBJ_LOCATION : '').toUpperCase().indexOf(searchVal) > -1
           && !(task.PPM_PERIODUOM ? task.PPM_PERIODUOM : '').toUpperCase().indexOf(searchVal) > -1
           && !(task.EVT_STATUS_DESC ? task.EVT_STATUS_DESC : '').toUpperCase().indexOf(searchVal) > -1
           && !(task.EVT_JOBTYPE_DESC ? task.EVT_JOBTYPE_DESC : '').toUpperCase().indexOf(searchVal) > -1
           && !(task.PERIODUOM_DESC ? task.PERIODUOM_DESC : '').toUpperCase().indexOf(searchVal) > -1) {
      return false;
    }

    return true;
  }


  var zoomConfig = {
    levels: [{
        name: "day",
        scale_height: 65,
        min_column_width: 80,
        scales: [{
            unit: "day",
            step: 1,
            format: function (date) {
              var dayScale = getConfiguredDayScale();
              var dateToStr = gantt.date.date_to_str(dayScale.dateFormat || "%d %M");
              var label = dateToStr(date);
              if (dayScale.showEstimatedHours) {
                label += " (" + (gGanttGlobal.EstimatedHours[date] ? gGanttGlobal.EstimatedHours[date] : "0") + ")";
              }
              return renderClickableTimelineDate(date, label);
            }
          }
        ]
      }, {
        name: "week",
        scale_height: 65,
        min_column_width: 50,
        scales: [{
            unit: "week",
            step: 1,
            format: function (date) {
              var dateToStr = gantt.date.date_to_str("%d %M");
              var endDate = gantt.date.add(date, -6, "day");
              var weekNum = gantt.date.date_to_str("%W")(date);
              return "Week #" + weekNum + ", " + dateToStr(date) + " - " + dateToStr(endDate);
            }
          }, {
            unit: "day",
            step: 1,
            format: function(date) {
              var dateToStr = gantt.date.date_to_str("%j %D");
              return renderClickableTimelineDate(date, dateToStr(date));
            }
          }
        ]
      }, {
        name: "month",
        scale_height: 65,
        min_column_width: 120,
        scales: [{
            unit: "month",
            format: "%F, %Y"
          }, {
            unit: "week",
            format: "Week #%W"
          }
        ]
      }, {
        name: "quarter",
        //height: 50,
        scale_height: 65,
        min_column_width: 90,
        scales: [{
            unit: "month",
            step: 1,
            format: "%M"
          }, {
            unit: "quarter",
            step: 1,
            format: function (date) {
              var dateToStr = gantt.date.date_to_str("%M");
              var endDate = gantt.date.add(gantt.date.add(date, 3, "month"), -1, "day");
              return dateToStr(date) + " - " + dateToStr(endDate);
            }
          }
        ]
      }, {
        name: "year",
        scale_height: 65,
        min_column_width: 30,
        scales: [{
            unit: "year",
            step: 1,
            format: "%Y"
          }
        ]
      }
    ]
  };


window.__IUXHUB_CORE_LOADED = true;
//# sourceURL=IUXHUB.core.js
