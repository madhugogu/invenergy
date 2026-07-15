// IUXHUB UI, rendering, popup, and Gantt helper functions. Loaded after IUXHUB.core.js.
//
// Feature map:
// 01. Quick Edit
// 02. Bulk Edit
// 03. Shared Scheduling, Date, and Highlight Helpers
// 05. Resources Panel
// 06. Gantt Layout and Rendering
// 07. Context Menu and Task Details
// 08. Configuration
// 09. Header and Legend
// 10. Schedule Review and Save
// 11. Export
// 12. Analytics and Resource Popups
// 13. Summary and Filtering
// 14. Header

  // ==========================================================================
  // 01. Quick Edit
  // ==========================================================================
  function processQuickPopup(id) {
    var selectedTask = gantt.getTask(id);
    var win;
    if (Ext.isEmpty(selectedTask.EVT_STATUS))
      return true;

    var vRecordWO = EAM.Ajax.request({
      url: "WSJOBS.HDR",
      params: {
        SYSTEM_FUNCTION_NAME: "WSJOBS",
        USER_FUNCTION_NAME: "WSJOBS",
        CURRENT_TAB_NAME: "HDR",
        CHECK_CF_CHANGEFLAG: true,
        workordernum: selectedTask.EVT_CODE,
        organization: selectedTask.EVT_ORG,
        pagemode: "view"
      }
    }).responseData.pageData.values;

    var vAvoidStatus = ['CANC', 'C']
    Ext.create('Ext.data.Store', {
      id: 'gantt.storestatus.store',
      data: vRecordWO["workorderstatus"].option.filter(function (status) {
        return vAvoidStatus.indexOf(status.value) == -1
      }),
      id: 'WOStatuses'
    });

    if (Ext.getCmp('wostatus_upd')) {
      try {
        Ext.getCmp('wostatus_upd').destroy();
      } catch (err) {}
    }
    if (Ext.getCmp('StartDate_upd')) {
      try {
        Ext.getCmp('StartDate_upd').destroy();
      } catch (err) {}
    }
    if (Ext.getCmp('EndDate_upd')) {
      try {
        Ext.getCmp('EndDate_upd').destroy();
      } catch (err) {}
    }
    if (Ext.getCmp('woupd_assignto')) {
      try {
        Ext.getCmp('woupd_assignto').destroy();
      } catch (err) {}
    }
    if (Ext.getCmp('woupd_assignby')) {
      try {
        Ext.getCmp('woupd_assignby').destroy();
      } catch (err) {}
    }
    if (Ext.getCmp('WoUpdatePanel1')) {
      try {
        Ext.getCmp('WoUpdatePanel1').destroy();
      } catch (err) {}
    }
    if (Ext.isEmpty(win)) {
      var panel = new Ext.Panel({
        cls: 'iux-edit-panel',
        padding: '0',
        layout: 'vbox',
        flex: 1,
        defaults: {
          width: 390,
          labelWidth: 105,
          labelAlign: 'left',
          margin: '0 20 10 20'
        },
        items: [{
            xtype: 'component',
            width: 430,
            margin: '0 0 14 0',
            html: '<div class="iux-edit-hero"><div><div class="iux-edit-title">Quick Edit</div><div class="iux-edit-subtitle">WO ' + safeHtml(selectedTask.EVT_CODE) + ' - ' + safeHtml(selectedTask.EVT_DESC || '') + '</div></div><span class="iux-edit-chip">' + safeHtml(selectedTask.EVT_ORG || '-') + '</span></div>'
          }, {
            xtype: 'combobox',
            store: Ext.getStore('WOStatuses'),
            fieldLabel: "Status",
            queryMode: 'local',
            displayField: 'display',
            valueField: 'value',
            value: vRecordWO["workorderstatus"].selected,
            id: "wostatus_upd",
          }, {
            xtype: 'uxdate',
            anchor: '100%',
            fieldLabel: "Start Date",
            //fieldLabel: 'From',
            id: 'StartDate_upd',
            value: new Date(vRecordWO.schedstartdate),
            //format: "d/m/y",
          }, {
            xtype: 'uxdate',
            anchor: '100%',
            fieldLabel: "End Date",
            //fieldLabel: 'From',
            id: 'EndDate_upd',
            value: new Date(vRecordWO.schedenddate),
            //format: "d/m/y",
          }, {
            name: 'woupd_assignto',
            id: "woupd_assignto",
            xtype: 'combobox',
            fieldLabel: "Assigned To",
            store: gGanttGlobal.Personal,
            value: vRecordWO.assignedto,
            queryMode: 'local',
            displayField: 'description',
            valueField: 'code',
            tpl: Ext.create('Ext.XTemplate',
              '<ul class="x-list-plain"><tpl for=".">',
              '<li role="option" class="x-boundlist-item gantt_font_size">{description}</li>',
              '</tpl></ul>')
          }, {
            name: 'woupd_assignby',
            id: "woupd_assignby",
            xtype: 'combobox',
            fieldLabel: "Assigned By",
            value: vRecordWO.schedgroup,
            queryMode: 'local',
            displayField: 'description',
            valueField: 'code',
            store: gGanttGlobal.SchedGroups,
            tpl: Ext.create('Ext.XTemplate',
              '<ul class="x-list-plain"><tpl for=".">',
              '<li role="option" class="x-boundlist-item gantt_font_size">{description}</li>',
              '</tpl></ul>')
          }
        ]
      });
      win = Ext.create('Ext.window.Window', {
        title: "<span style='color:#ffffff;'><b>Quick Edit</b></span>",
        width: 455,
        height: 420,
        id: 'WoUpdatePanel1',
        modal: true,
        closable: true,
        align: 'center', // Align the window contents in center
        items: [panel],
        layout: 'fit',
        modal: true,
        cls: 'iux-modern-window iux-product-window',
        header: {
          style: {
            'background-color': '#383838',
            'color': '#ffffff'
          }
        },
        bbar: {
          layout: {
            type: 'hbox',
            pack: 'center'
          },
          items: [{
              text: '<i class="fa fa-times" style="margin-right:5px;"></i>Close',
              handler: function () {
                win.close();
              }
            }, {
              text: '<i class="fa fa-check" style="margin-right:5px;"></i>Save',
              handler: function () {
                var vError = false;
                var vNewSartDate = Ext.getCmp('StartDate_upd').rawDate;
                var vEndDate = Ext.getCmp('EndDate_upd').rawDate;
                if (vEndDate != "" && vNewSartDate != "") {
                  var dNewStartDate = new Date(vNewSartDate);
                  var dEndDate = new Date(vEndDate);
                  var month = dEndDate.getUTCMonth() + 1; //months from 1-12
                  var day = dEndDate.getUTCDate();
                  var year = dEndDate.getUTCFullYear();
                  var date_str = month + "/" + day + "/" + year;
                  if (dEndDate < dNewStartDate) {
                    vError = true;
                    EAM.MsgBox.show({
                      msgs: [{
                          type: 'error',
                          msg: EAM.Utils.String.format('Scheduled start date must not be greater than Scheduled end date: ' + date_str)
                        }
                      ],
                      buttons: EAM.MsgBox.OK,
                      fn: function (e) {
                        if (e == 'ok') {}
                      }
                    });
                  }
                }
                if (vError == false) {
                  EAM.Utils.mask();
                  setTimeout(function () {
                    var vRecordWOUpd = EAM.Ajax.request({
                      url: "WSJOBS.HDR",
                      params: {
                        SYSTEM_FUNCTION_NAME: "WSJOBS",
                        USER_FUNCTION_NAME: "WSJOBS",
                        CURRENT_TAB_NAME: "HDR",
                        CHECK_CF_CHANGEFLAG: true,
                        workordernum: selectedTask.EVT_CODE,
                        organization: selectedTask.EVT_ORG,
                        pagemode: "view"
                      }
                    }).responseData.pageData.values;
                    for (var k in vRecordWOUpd) {
                      if (Ext.isObject(vRecordWOUpd[k])) {
                        vRecordWOUpd[k] = vRecordWOUpd[k].selected
                      }
                    }
                    if (!Ext.isEmpty(Ext.getCmp('StartDate_upd').value)) {
                      vRecordWOUpd.schedstartdate = formatDate(Ext.getCmp('StartDate_upd').rawDate);
                    } else {
                      vRecordWOUpd.schedstartdate = "";
                    }
                    if (!Ext.isEmpty(Ext.getCmp('EndDate_upd').value)) {
                      vRecordWOUpd.schedenddate = formatDate(Ext.getCmp('EndDate_upd').rawDate);
                    } else {
                      vRecordWOUpd.schedenddate = "";
                    }

                    vRecordWOUpd.workorderstatus = Ext.getCmp('wostatus_upd').value;
                    var dStart = new Date(EAM.utils.Date.parseDate(vRecordWOUpd.schedstartdate));
                    dStart.setDate(dStart.getDate() + EAM.utils.Date.diffDays(EAM.utils.Date.parseDate(vRecordWOUpd.schedstartdate), EAM.utils.Date.parseDate(vRecordWOUpd.schedstartdate)));
                    var dEnd = new Date(EAM.utils.Date.parseDate(vRecordWOUpd.schedenddate));
                    dEnd.setDate(dEnd.getDate() + EAM.utils.Date.diffDays(EAM.utils.Date.parseDate(vRecordWOUpd.schedenddate), EAM.utils.Date.parseDate(vRecordWOUpd.schedenddate)));
                    vRecordWOUpd.schedstartdate = formatDate(new Date(dStart.getFullYear(), dStart.getMonth(), dStart.getDate(), '00', '00'));
                    vRecordWOUpd.schedenddate = formatDate(new Date(dEnd.getFullYear(), dEnd.getMonth(), dEnd.getDate(), '00', '00'));
                    vRecordWOUpd.assignedto = Ext.getCmp('woupd_assignto').value;
                    vRecordWOUpd.schedgroup = Ext.getCmp('woupd_assignby').value;

                    var vStatusWOUpd = EAM.Ajax.request({
                      url: "WSJOBS.HDR?pageaction=SAVE",
                      params: Ext.merge(vRecordWOUpd, {
                        SYSTEM_FUNCTION_NAME: "WSJOBS",
                        USER_FUNCTION_NAME: "WSJOBS",
                        CURRENT_TAB_NAME: "HDR",
                        CHECK_CF_CHANGEFLAG: true,
                        can_update: true,
                        pagemode: "view"
                      })
                    });
                    if (vStatusWOUpd.success) {
                      var vMsg = 'Record saved Save Successfully';
                      EAM.Messaging.showConfirmation(vMsg);
                      selectedTask.start_date = new Date(Ext.getCmp('StartDate_upd').rawDate);
                      var vPickerEnd = new Date(Ext.getCmp('EndDate_upd').rawDate);
                      vPickerEnd.setDate(vPickerEnd.getDate() + 1); // DHTMLX end_date is exclusive (one day past visual end)
                      selectedTask.end_date = vPickerEnd;
                      selectedTask.EVT_PERSON = Ext.getCmp('woupd_assignto').value;
                      selectedTask.EVT_SCHEDGRP = Ext.getCmp('woupd_assignby').value;
                      gantt.sort("start_date", false);
                      win.close();
                      gantt.render();
                      gantt.sort('start_date', false);
                      Ext.getCmp("reloadGanttNow").removeCls('highlight-button');
                      Ext.getCmp("submitGanttNow").removeCls('highlight-button');
                    }
                    EAM.Utils.unmask();
                  }, 100);
                }
              }
            }
          ]
        }
      });
      win.show();
    }

  }

  // ==========================================================================
  // 02. Bulk Edit
  // ==========================================================================
  function isBulkEditableTask(task) {
    if (!task) return false;
    return !isReadonlyStatusTask(task);
  }

  function getConfiguredReadonlyStatuses() {
    return (getConfiguredExperience().readonlyStatuses || []).map(function(status) {
      return String(status || '').toUpperCase();
    });
  }

  function isReadonlyStatusTask(task) {
    if (!task) return false;
    var status = String(task.EVT_STATUS || '').toUpperCase();
    return getConfiguredReadonlyStatuses().indexOf(status) !== -1;
  }

  function getBulkSelectedIds() {
    var selected = gGanttGlobal.BulkEditSelected || {};
    return Object.keys(selected).filter(function(id) { return selected[id]; });
  }

  function toggleBulkTaskSelection(id, checked) {
    if (!gGanttGlobal.BulkEditSelected) gGanttGlobal.BulkEditSelected = {};
    var task = gantt.getTask(id);
    if (!isBulkEditableTask(task)) {
      delete gGanttGlobal.BulkEditSelected[id];
      return;
    }
    if (checked) gGanttGlobal.BulkEditSelected[id] = true;
    else delete gGanttGlobal.BulkEditSelected[id];
    updateToolbarState();
  }

  function getBulkSelectedTasks() {
    if (!isFeatureEnabled('bulkEdit')) return [];
    if (typeof gantt === 'undefined' || !gantt.getTask) return [];
    return getBulkSelectedIds().map(function(id) {
      try { return gantt.getTask(id); } catch (e) { return null; }
    }).filter(function(task) { return isBulkEditableTask(task); });
  }

  function updateToolbarState() {
    var saveButton = Ext.getCmp("submitGanttNow");
    if (saveButton && saveButton.setDisabled) {
      saveButton.setDisabled(!(gGanttGlobal.TasksModified && gGanttGlobal.TasksModified.length > 0));
    }

    if (!isFeatureEnabled('bulkEdit')) {
      gGanttGlobal.ganttConfig.bulkEditEnabled = false;
      gGanttGlobal.BulkEditSelected = {};
    }

    var selectedCount = getBulkSelectedTasks().length;
    var badge = document.getElementById('bulkEditSelectedBadge');
    var mode = document.getElementById('bulkEditModeBadge');
    if (badge) {
      badge.innerHTML = 'Selected: ' + selectedCount;
      badge.style.display = isFeatureEnabled('bulkEdit') && gGanttGlobal.ganttConfig.bulkEditEnabled ? 'inline-flex' : 'none';
    }
    if (mode) {
      mode.innerHTML = isFeatureEnabled('bulkEdit') && gGanttGlobal.ganttConfig.bulkEditEnabled ? 'Bulk Edit ON' : 'Bulk Edit OFF';
      mode.className = 'iux-bulk-mode-badge ' + (isFeatureEnabled('bulkEdit') && gGanttGlobal.ganttConfig.bulkEditEnabled ? 'is-on' : 'is-off');
    }
    syncBulkSelectAllState();
    updateSummaryFilterIndicator();
  }

  function getVisibleBulkEditableSelectionState() {
    var total = 0;
    var selected = 0;
    if (typeof gantt === 'undefined' || !gantt.eachTask) {
      return { total: 0, selected: 0 };
    }

    gantt.eachTask(function(task) {
      var visible = task._summaryVisible !== false && task._columnVisible !== false && isSearchSuccess(task.id, task);
      if (!visible || !isBulkEditableTask(task)) return;
      total++;
      if (gGanttGlobal.BulkEditSelected && gGanttGlobal.BulkEditSelected[task.id]) selected++;
    });
    return { total: total, selected: selected };
  }

  function syncBulkSelectAllState() {
    var header = document.getElementById('iuxBulkSelectAll');
    if (!header) return;
    var state = getVisibleBulkEditableSelectionState();
    header.checked = state.total > 0 && state.selected === state.total;
    header.indeterminate = state.selected > 0 && state.selected < state.total;
    header.disabled = state.total === 0;
    header.title = state.total === 0
      ? 'No visible work orders are eligible for Bulk Edit'
      : (state.selected + ' of ' + state.total + ' visible work orders selected');
  }

  function setAllVisibleBulkSelections(checked) {
    if (!gGanttGlobal.BulkEditSelected) gGanttGlobal.BulkEditSelected = {};
    gantt.eachTask(function(task) {
      var visible = task._summaryVisible !== false && task._columnVisible !== false && isSearchSuccess(task.id, task);
      if (!visible || !isBulkEditableTask(task)) return;
      if (checked) gGanttGlobal.BulkEditSelected[task.id] = true;
      else delete gGanttGlobal.BulkEditSelected[task.id];
    });
    gantt.render();
    updateToolbarState();
  }

  function buildBulkSelectColumn() {
    return {
      name: "IUX_BULK_SELECT",
      id: "iux_bulk_select",
      label: '<input type="checkbox" id="iuxBulkSelectAll" title="Select visible work orders" />',
      width: 46,
      resize: false,
      align: "center",
      template: function(task) {
        var disabled = isBulkEditableTask(task) ? '' : ' disabled title="Bulk Edit is not available for configured read-only statuses"';
        var checked = gGanttGlobal.BulkEditSelected && gGanttGlobal.BulkEditSelected[task.id] ? ' checked' : '';
        return '<input type="checkbox" class="iux-bulk-select" data-task-id="' + safeHtml(task.id) + '"' + checked + disabled + ' />';
      }
    };
  }

  function isFutureEventTask(task) {
    var status = String((task && task.EVT_STATUS) || '').toUpperCase();
    return status === 'FWD' || status === 'FWP';
  }

  function getFutureSequenceValue(task) {
    if (!task) return '';
    return task.fut_seqno || task.FUT_SEQNO || task.FUTURE_SEQUNCE || task.future_sequence || '';
  }

  function buildWorkOrderIndicatorColumn() {
    return {
      name: "IUX_WO_INDICATOR",
      id: "iux_wo_indicator",
      label: '<i class="fa fa-info-circle" title="Work order type"></i>',
      width: 46,
      resize: false,
      align: "center",
      template: function(task) {
        if (isFutureEventTask(task)) {
          var seq = String(getFutureSequenceValue(task) || '').toLowerCase();
          var seqHtml = seq ? '<span class="iux-wo-indicator-seq">' + safeHtml(seq) + '</span>' : '';
          return '<span class="iux-wo-indicator iux-wo-indicator-future" title="Future Event">' +
            seqHtml + '<i class="fa fa-hourglass-half"></i></span>';
        }
        return '<span class="iux-wo-indicator iux-wo-indicator-regular" title="Work Order">' +
          '<i class="fa fa-wrench"></i></span>';
      }
    };
  }

  function getGanttGridWidthForBulkMode() {
    var configuredWidth = getConfiguredGridWidth();
    return isFeatureEnabled('bulkEdit') && gGanttGlobal.ganttConfig.bulkEditEnabled
      ? Math.max(configuredWidth, 546)
      : configuredWidth;
  }

  function applyGanttGridWidthToLayout(layout, width) {
    if (!layout) return;
    if ((layout.view === "grid" || layout.view === "resourceGrid") ||
        (layout.rows && layout.rows[0] && (layout.rows[0].view === "grid" || layout.rows[0].view === "resourceGrid"))) {
      layout.width = width;
      layout.min_width = width;
    }
    if (layout.rows) {
      layout.rows.forEach(function(row) {
        applyGanttGridWidthToLayout(row, width);
      });
    }
    if (layout.cols) {
      layout.cols.forEach(function(col) {
        applyGanttGridWidthToLayout(col, width);
      });
    }
  }

  function refreshGanttColumnsAfterBulkModeChange() {
    if (typeof gantt === 'undefined' || !gantt.config) return;
    gantt.config.columns = gGanttGlobal.ListColumnsStore;
    applyGanttGridWidthToLayout(gantt.config.layout, getGanttGridWidthForBulkMode());
    if (gantt.resetLayout) {
      gantt.resetLayout();
    } else if (gantt.$container && gantt.init) {
      gantt.init("gantt_here");
    }
    if (gantt.render) gantt.render();
    scheduleGanttTooltipConfigure();
  }

  function applyBulkEditColumn(refreshNow) {
    var columns = (gGanttGlobal.ListColumnsStore || []).filter(function(column) {
      return column.name !== "IUX_BULK_SELECT" && column.name !== "IUX_WO_INDICATOR";
    });
    columns.unshift(buildWorkOrderIndicatorColumn());
    if (!isFeatureEnabled('bulkEdit')) {
      gGanttGlobal.ganttConfig.bulkEditEnabled = false;
      gGanttGlobal.BulkEditSelected = {};
    }
    if (isFeatureEnabled('bulkEdit') && gGanttGlobal.ganttConfig.bulkEditEnabled) {
      columns.unshift(buildBulkSelectColumn());
    } else {
      gGanttGlobal.BulkEditSelected = {};
    }
    gGanttGlobal.ListColumnsStore = columns;
    if (refreshNow) refreshGanttColumnsAfterBulkModeChange();
    else if (typeof gantt !== 'undefined' && gantt.config) gantt.config.columns = gGanttGlobal.ListColumnsStore;
    updateToolbarState();
  }

  function isBulkEditRefreshBlocked() {
    return isFeatureEnabled('bulkEdit') &&
      gGanttGlobal.ganttConfig &&
      gGanttGlobal.ganttConfig.bulkEditEnabled;
  }

  function validateRefreshAllowed() {
    if (!isBulkEditRefreshBlocked()) return true;
    EAM.Messaging.showConfirmation('Bulk Edit is currently ON. Turn off Bulk Edit before refreshing the Gantt.');
    return false;
  }

  function makeBulkComboStore(store, includeBlank) {
    var data = includeBlank ? [{ code: "", description: "No Change" }] : [];
    var seen = { "": true };
    if (store && store.each) {
      store.each(function(record) {
        var code = record.get('code');
        if (Ext.isEmpty(code) || seen[String(code)]) return;
        seen[String(code)] = true;
        data.push({ code: code, description: record.get('description') || code });
      });
    }
    return Ext.create('Ext.data.Store', { fields: ['code', 'description'], data: data });
  }

  function makeBulkShiftStore() {
    var data = [{ code: "", description: "No Change" }];
    var seen = { "": true };
    (gGanttGlobal.ResourceData || []).forEach(function(row) {
      var code = row.SHIFT || row.shift;
      if (Ext.isEmpty(code) || seen[String(code)]) return;
      seen[String(code)] = true;
      data.push({ code: code, description: code });
    });
    return Ext.create('Ext.data.Store', { fields: ['code', 'description'], data: data.sort(function(a, b) {
      return String(a.code).localeCompare(String(b.code));
    }) });
  }

  function createBulkApplyCheckbox(id, label) {
    return { xtype: 'checkboxfield', boxLabel: label, id: id, width: 84, margin: '0 8 0 0' };
  }

  function destroyBulkEditComponents() {
    ['bulkStatusApply', 'bulkStartApply', 'bulkEndApply', 'bulkAssignedToApply', 'bulkAssignedByApply', 'bulkShiftApply',
     'bulkStatus', 'bulkStartDate', 'bulkEndDate', 'bulkAssignedTo', 'bulkAssignedBy', 'bulkShift', 'BulkWoUpdatePanel'].forEach(function(id) {
      var cmp = Ext.getCmp(id);
      if (cmp) {
        try { cmp.destroy(); } catch (e) {}
      }
    });
  }

  function buildBulkEditValues() {
    var values = {};
    if (Ext.getCmp('bulkStatusApply').getValue()) values.workorderstatus = Ext.getCmp('bulkStatus').getValue();
    if (Ext.getCmp('bulkStartApply').getValue()) values.schedstartdate = Ext.getCmp('bulkStartDate').rawDate;
    if (Ext.getCmp('bulkEndApply').getValue()) values.schedenddate = Ext.getCmp('bulkEndDate').rawDate;
    if (Ext.getCmp('bulkAssignedToApply').getValue()) values.assignedto = Ext.getCmp('bulkAssignedTo').getValue();
    if (Ext.getCmp('bulkAssignedByApply').getValue()) values.schedgroup = Ext.getCmp('bulkAssignedBy').getValue();
    if (Ext.getCmp('bulkShiftApply').getValue()) values.shift = Ext.getCmp('bulkShift').getValue();
    return values;
  }

  function validateBulkEditValues(values) {
    if (Object.keys(values).length === 0) {
      EAM.Messaging.showConfirmation('Select at least one field to apply.');
      return false;
    }
    if (values.hasOwnProperty('workorderstatus') && Ext.isEmpty(values.workorderstatus)) {
      EAM.Messaging.showConfirmation('Select a status value or clear Apply for Status.');
      return false;
    }
    if (values.hasOwnProperty('schedstartdate') && Ext.isEmpty(values.schedstartdate)) {
      EAM.Messaging.showConfirmation('Select a start date or clear Apply for Start Date.');
      return false;
    }
    if (values.hasOwnProperty('schedenddate') && Ext.isEmpty(values.schedenddate)) {
      EAM.Messaging.showConfirmation('Select an end date or clear Apply for End Date.');
      return false;
    }
    if (values.hasOwnProperty('assignedto') && Ext.isEmpty(values.assignedto)) {
      EAM.Messaging.showConfirmation('Select an assigned to value or clear Apply for Assigned To.');
      return false;
    }
    if (values.hasOwnProperty('schedgroup') && Ext.isEmpty(values.schedgroup)) {
      EAM.Messaging.showConfirmation('Select an assigned by value or clear Apply for Assigned By.');
      return false;
    }
    if (values.hasOwnProperty('shift') && Ext.isEmpty(values.shift)) {
      EAM.Messaging.showConfirmation('Select a shift value or clear Apply for Shift.');
      return false;
    }
    if (values.schedstartdate && values.schedenddate) {
      var start = new Date(values.schedstartdate);
      var end = new Date(values.schedenddate);
      if (end < start) {
        EAM.Messaging.showConfirmation('Scheduled start date must not be greater than scheduled end date.');
        return false;
      }
    }
    return true;
  }

  function applyBulkValuesToRecord(record, values) {
    if (values.hasOwnProperty('schedstartdate')) record.schedstartdate = values.schedstartdate ? formatDate(values.schedstartdate) : "";
    if (values.hasOwnProperty('schedenddate')) record.schedenddate = values.schedenddate ? formatDate(values.schedenddate) : "";
    if (values.hasOwnProperty('workorderstatus')) record.workorderstatus = values.workorderstatus;
    if (values.hasOwnProperty('assignedto')) record.assignedto = values.assignedto;
    if (values.hasOwnProperty('schedgroup')) record.schedgroup = values.schedgroup;
    if (values.hasOwnProperty('shift')) applyShiftValueToWorkOrderRecord(record, values.shift);
  }

  function applyBulkValuesToTask(task, values) {
    if (values.hasOwnProperty('schedstartdate') && values.schedstartdate) {
      task.start_date = new Date(values.schedstartdate);
      task.EVT_TARGET = formatDateForGantt(new Date(values.schedstartdate));
    }
    if (values.hasOwnProperty('schedenddate') && values.schedenddate) {
      var visualEnd = new Date(values.schedenddate);
      task.EVT_SCHEDEND = formatDateForGantt(visualEnd);
      task.end_date = toGanttExclusiveEndDate(visualEnd);
    }
    if (values.hasOwnProperty('workorderstatus')) {
      task.EVT_STATUS = values.workorderstatus;
      var idx = gGanttGlobal.WorkorderStatusStore.findExact('code', values.workorderstatus);
      task.EVT_STATUS_DESC = idx !== -1 ? gGanttGlobal.WorkorderStatusStore.getAt(idx).get('description') : values.workorderstatus;
      task.color = getColor(task.EVT_STATUS, task.EVT_JOBTYPE);
    }
    if (values.hasOwnProperty('assignedto')) task.EVT_PERSON = values.assignedto;
    if (values.hasOwnProperty('schedgroup')) task.EVT_SCHEDGRP = values.schedgroup;
    if (values.hasOwnProperty('shift')) task.EVT_SHIFT = values.shift;
  }

  function getBulkLookupDescription(store, code) {
    if (Ext.isEmpty(code) || !store || !store.findExact) return code || '-';
    var idx = store.findExact('code', code);
    if (idx === -1) return code;
    var desc = store.getAt(idx).get('description');
    return desc ? code + ' - ' + desc : code;
  }

  function getBulkTaskDateValue(task, fieldName, fallbackName) {
    var value = task[fieldName] || task[fallbackName];
    if (Ext.isEmpty(value)) return '-';
    var date = parseGanttDateValue(value);
    return isNaN(date.getTime()) ? value : formatDateDMY(date);
  }

  function getBulkNewValueDisplay(fieldName, value) {
    if (fieldName === 'workorderstatus') return getBulkLookupDescription(gGanttGlobal.WorkorderStatusStore, value);
    if (fieldName === 'assignedto') return getBulkLookupDescription(gGanttGlobal.Personal, value);
    if (fieldName === 'schedgroup') return getBulkLookupDescription(gGanttGlobal.SchedGroups, value);
    if (fieldName === 'schedstartdate' || fieldName === 'schedenddate') return formatDateDMY(new Date(value));
    return value || '-';
  }

  function buildBulkReviewChangesForTask(task, values) {
    var changes = [];
    if (values.hasOwnProperty('workorderstatus')) {
      changes.push({ label: 'Status', oldValue: getBulkLookupDescription(gGanttGlobal.WorkorderStatusStore, task.EVT_STATUS), newValue: getBulkNewValueDisplay('workorderstatus', values.workorderstatus) });
    }
    if (values.hasOwnProperty('schedstartdate')) {
      changes.push({ label: 'Start Date', oldValue: getBulkTaskDateValue(task, 'EVT_TARGET', 'originalStart'), newValue: getBulkNewValueDisplay('schedstartdate', values.schedstartdate) });
    }
    if (values.hasOwnProperty('schedenddate')) {
      changes.push({ label: 'End Date', oldValue: getBulkTaskDateValue(task, 'EVT_SCHEDEND', 'originalEnd'), newValue: getBulkNewValueDisplay('schedenddate', values.schedenddate) });
    }
    if (values.hasOwnProperty('assignedto')) {
      changes.push({ label: 'Assigned To', oldValue: getBulkLookupDescription(gGanttGlobal.Personal, task.EVT_PERSON), newValue: getBulkNewValueDisplay('assignedto', values.assignedto) });
    }
    if (values.hasOwnProperty('schedgroup')) {
      changes.push({ label: 'Assigned By', oldValue: getBulkLookupDescription(gGanttGlobal.SchedGroups, task.EVT_SCHEDGRP), newValue: getBulkNewValueDisplay('schedgroup', values.schedgroup) });
    }
    if (values.hasOwnProperty('shift')) {
      changes.push({ label: 'Shift', oldValue: task.EVT_SHIFT || '-', newValue: getBulkNewValueDisplay('shift', values.shift) });
    }
    return changes;
  }

  function renderBulkReviewChangeList(changes, type) {
    return changes.map(function(change) {
      return '<div class="gantt-review-date ' + (type === 'old' ? 'gantt-review-old' : 'gantt-review-new') + '">' +
        '<b>' + safeHtml(change.label) + ':</b> ' + safeHtml(type === 'old' ? change.oldValue : change.newValue) +
      '</div>';
    }).join('');
  }

  function showBulkEditReviewPopup(tasks, values, editWin) {
    if (Ext.getCmp('bulkReviewWin')) Ext.getCmp('bulkReviewWin').destroy();

    var rows = '';
    tasks.forEach(function(task) {
      var changes = buildBulkReviewChangesForTask(task, values);
      rows +=
        '<tr>' +
          '<td>' +
            '<a data-wo-code="' + safeHtml(task.EVT_CODE) + '" class="gantt-review-wo">' + safeHtml(task.EVT_CODE) + '</a>' +
            '<div class="gantt-review-meta">' + safeHtml(task.EVT_DESC || '') + '</div>' +
          '</td>' +
          '<td><span class="gantt-review-chip">' + safeHtml(task.EVT_ORG || '-') + '</span></td>' +
          '<td>' + renderBulkReviewChangeList(changes, 'old') + '</td>' +
          '<td>' + renderBulkReviewChangeList(changes, 'new') + '</td>' +
        '</tr>';
    });

    var tableHTML =
      '<div class="gantt-popup-shell">' +
        '<div class="gantt-popup-hero">' +
          '<div><div class="gantt-popup-title">Review Bulk Edit Changes</div>' +
          '<div class="gantt-popup-subtitle">Confirm old and new values before applying bulk updates.</div></div>' +
          '<div class="gantt-popup-statbar">' +
            '<div class="gantt-popup-stat"><strong>' + tasks.length + '</strong><span>Selected</span></div>' +
          '</div>' +
        '</div>' +
        '<div style="padding:14px 16px;">' +
          '<div class="iux-bulk-warning" style="margin-bottom:12px;"><b>Additional Note:</b> All Work Orders will be Set to the Input Values. The Process would Override EAM Status Authorization Practices.</div>' +
          '<table class="gantt-review-table">' +
            '<thead><tr><th>Work Order</th><th>Org</th><th>Old Values</th><th>New Values</th></tr></thead>' +
            '<tbody>' + rows + '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>';

    var reviewWin = Ext.create('Ext.window.Window', {
      id: 'bulkReviewWin',
      cls: 'iux-product-window',
      title: '<i class="fa fa-list-alt" style="margin-right:8px;"></i><b style="color:white;">Review Bulk Edit Changes (' + tasks.length + ')</b>',
      width: 980,
      height: 560,
      modal: true,
      scrollable: true,
      bodyPadding: 0,
      header: { style: { 'background-color': '#383838', 'color': '#ffffff' } },
      style: { 'border-radius': '8px' },
      html: tableHTML,
      listeners: {
        afterrender: function(win) {
          win.getEl().dom.addEventListener('click', function(e) {
            var woLink = e.target.closest ? e.target.closest('[data-wo-code]') : null;
            if (!woLink) return;
            var vParameters = {};
            vParameters.SYSTEM_FUNCTION_NAME = 'WSJOBS';
            vParameters.USER_FUNCTION_NAME = 'WSJOBS';
            vParameters.CURRENT_TAB_NAME = 'HDR';
            vParameters.initpath = 'WSJOBS';
            vParameters.filterfields = 'workordernum';
            vParameters.filteroperator = encodeURIComponent('=');
            vParameters.filtervalue = woLink.getAttribute('data-wo-code');
            openHyperlink(vParameters);
          });
        }
      },
      buttons: [{
        text: '<i class="fa fa-save" style="margin-right:6px;"></i>Save All',
        style: { 'background-color': '#28a745', 'border-color': '#1e7e34', 'color': 'white' },
        handler: function() { saveBulkWorkOrderUpdates(tasks, values, editWin, reviewWin); }
      }, {
        text: '<i class="fa fa-times" style="margin-right:4px;"></i>Back',
        handler: function() { reviewWin.close(); }
      }],
      buttonAlign: 'right'
    });
    reviewWin.show();
  }

  function saveBulkWorkOrderUpdates(tasks, values, win, reviewWin) {
    EAM.Utils.mask();
    setTimeout(function() {
      var successCount = 0;
      var failed = [];
      try {
        tasks.forEach(function(task) {
          try {
            var vRecordWOUpd = EAM.Ajax.request({
              url: "WSJOBS.HDR",
              params: {
                SYSTEM_FUNCTION_NAME: "WSJOBS",
                USER_FUNCTION_NAME: "WSJOBS",
                CURRENT_TAB_NAME: "HDR",
                CHECK_CF_CHANGEFLAG: true,
                workordernum: task.EVT_CODE,
                organization: task.EVT_ORG,
                pagemode: "view"
              }
            }).responseData.pageData.values;

            for (var k in vRecordWOUpd) {
              if (Ext.isObject(vRecordWOUpd[k])) vRecordWOUpd[k] = vRecordWOUpd[k].selected;
            }

            applyBulkValuesToRecord(vRecordWOUpd, values);

            var vStatusWOUpd = EAM.Ajax.request({
              url: "WSJOBS.HDR?pageaction=SAVE",
              params: Ext.merge(vRecordWOUpd, {
                SYSTEM_FUNCTION_NAME: "WSJOBS",
                USER_FUNCTION_NAME: "WSJOBS",
                CURRENT_TAB_NAME: "HDR",
                CHECK_CF_CHANGEFLAG: true,
                can_update: true,
                pagemode: "view"
              })
            });

            if (vStatusWOUpd.success) {
              successCount++;
              applyBulkValuesToTask(task, values);
              clearPendingScheduleChange(task.id);
              delete gGanttGlobal.BulkEditSelected[task.id];
            } else {
              failed.push(task.EVT_CODE);
            }
          } catch (rowError) {
            console.error("Bulk update failed for work order", task && task.EVT_CODE, rowError);
            failed.push(task && task.EVT_CODE ? task.EVT_CODE : task.id);
          }
        });

        rebuildShutdownDateCacheFromGantt();
        gantt.render();
        gantt.sort('start_date', false);
        updateHeader();
        EAM.Messaging.showConfirmation('Bulk edit completed. Updated ' + successCount + ' work order(s)' + (failed.length ? '. Failed: ' + failed.join(', ') : '.'));
        if (reviewWin && failed.length === 0) reviewWin.close();
        if (win && failed.length === 0) win.close();
      } finally {
        EAM.Utils.unmask();
      }
    }, 100);
  }

  function showBulkQuickEditPopup() {
    if (!isFeatureEnabled('bulkEdit')) return false;
    var tasks = getBulkSelectedTasks();
    if (!tasks.length) {
      EAM.Messaging.showConfirmation('Select one or more work orders in the Bulk Edit checkbox column first.');
      return;
    }

    destroyBulkEditComponents();

    var fieldDefaults = { labelAlign: 'left', labelWidth: 92, width: 360, margin: '0 0 8 0' };
    var row = function(applyId, label, inputCfg) {
      return {
        xtype: 'container',
        layout: 'hbox',
        margin: '0 20 6 20',
        items: [createBulkApplyCheckbox(applyId, 'Apply'), Ext.apply(inputCfg, fieldDefaults)]
      };
    };

    var panel = new Ext.Panel({
      cls: 'iux-edit-panel',
      padding: '0',
      layout: 'vbox',
      items: [{
          xtype: 'component',
          width: 490,
          margin: '0 0 14 0',
          html: '<div class="iux-edit-hero"><div><div class="iux-edit-title">Bulk Quick Edit</div><div class="iux-edit-subtitle">Set selected work orders to shared values</div></div><span class="iux-edit-chip">' + tasks.length + ' selected</span></div>' +
                '<div class="iux-bulk-warning"><b>Additional Note:</b> All Work Orders will be Set to the Input Values. The Process would Override EAM Status Authorization Practices.</div>'
        },
        row('bulkStatusApply', 'Status', {
          xtype: 'combobox',
          id: 'bulkStatus',
          fieldLabel: 'Status',
          store: makeBulkComboStore(gGanttGlobal.WorkorderStatusStore, true),
          queryMode: 'local',
          displayField: 'description',
          valueField: 'code',
          value: ''
        }),
        row('bulkStartApply', 'Start Date', {
          xtype: 'uxdate',
          id: 'bulkStartDate',
          fieldLabel: 'Start Date'
        }),
        row('bulkEndApply', 'End Date', {
          xtype: 'uxdate',
          id: 'bulkEndDate',
          fieldLabel: 'End Date'
        }),
        row('bulkAssignedToApply', 'Assigned To', {
          xtype: 'combobox',
          id: 'bulkAssignedTo',
          fieldLabel: 'Assigned To',
          store: makeBulkComboStore(gGanttGlobal.Personal, true),
          queryMode: 'local',
          displayField: 'description',
          valueField: 'code',
          value: ''
        }),
        row('bulkAssignedByApply', 'Assigned By', {
          xtype: 'combobox',
          id: 'bulkAssignedBy',
          fieldLabel: 'Assigned By',
          store: makeBulkComboStore(gGanttGlobal.SchedGroups, true),
          queryMode: 'local',
          displayField: 'description',
          valueField: 'code',
          value: ''
        }),
        row('bulkShiftApply', 'Shift', {
          xtype: 'combobox',
          id: 'bulkShift',
          fieldLabel: 'Shift',
          store: makeBulkShiftStore(),
          queryMode: 'local',
          displayField: 'description',
          valueField: 'code',
          value: ''
        })
      ]
    });

    var win = Ext.create('Ext.window.Window', {
      title: '<span style="color:#ffffff;"><b>Bulk Quick Edit</b></span>',
      width: 530,
      height: 485,
      id: 'BulkWoUpdatePanel',
      modal: true,
      closable: true,
      layout: 'fit',
      cls: 'iux-modern-window iux-product-window',
      items: [panel],
      header: { style: { 'background-color': '#383838', 'color': '#ffffff' } },
      bbar: {
        layout: { type: 'hbox', pack: 'center' },
        items: [{
          text: '<i class="fa fa-times" style="margin-right:5px;"></i>Close',
          handler: function() { win.close(); }
        }, {
          text: '<i class="fa fa-list-alt" style="margin-right:5px;"></i>Review',
          handler: function() {
            var values = buildBulkEditValues();
            if (!validateBulkEditValues(values)) return;
            showBulkEditReviewPopup(tasks, values, win);
          }
        }]
      }
    });
    win.show();
  }

  // Shift Assignment Planner moved to IUXHUB.shift.js.

  function getConfiguredExperience() {
    return normalizeGanttConfigurationJson(gGanttGlobal.ConfigurationJson || createEmptyGanttConfigurationJson()).experience;
  }

  function getConfiguredGridWidth() {
    var experience = getConfiguredExperience();
    var viewportWidth = (gantt && gantt.$container && gantt.$container.clientWidth) || document.documentElement.clientWidth || 1200;
    var percentWidth = Math.floor(viewportWidth * (experience.gridWidthPercent / 100));
    return Math.max(360, Math.min(percentWidth, Math.floor(viewportWidth * 0.4)));
  }

  function getTaskCustomerSpecificDateKey(task) {
    if (!task) return '';
    var fieldName = getConfiguredExperience().timelineHighlightField || "EVT_UDFDATE01";
    var sourceValue = task[fieldName];
    if (!sourceValue) return '';
    if (task._iuxCustomerDateField === fieldName && task._iuxCustomerDateSource === sourceValue) return task._iuxCustomerDateKey || '';
    var customerDate = parseGanttDateValue(sourceValue);
    task._iuxCustomerDateField = fieldName;
    task._iuxCustomerDateSource = sourceValue;
    task._iuxCustomerDateKey = customerDate && !isNaN(customerDate.getTime()) ? getDateKey(customerDate) : '';
    return task._iuxCustomerDateKey;
  }

  function getGanttAlternateRowClass(task) {
    if (!getConfiguredExperience().alternateGanttRows || !task) return '';
    var index = -1;
    try {
      if (typeof gantt !== 'undefined' && gantt.getTaskIndex) index = gantt.getTaskIndex(task.id);
    } catch (e) {}
    if (index < 0 && !isNaN(parseInt(task.$index, 10))) index = parseInt(task.$index, 10);
    if (index < 0 && !Ext.isEmpty(task.id)) {
      var text = String(task.id);
      var hash = 0;
      for (var i = 0; i < text.length; i++) hash += text.charCodeAt(i);
      index = hash;
    }
    return index % 2 === 1 ? 'iux-gantt-alt-row' : '';
  }

  function getConfiguredTaskText(task) {
    var mode = getConfiguredExperience().taskTextMode || "DESCRIPTION";
    var wo = task.EVT_CODE || task.evt_code || task.id || "";
    var desc = task.EVT_DESC || task.evt_desc || task.text || "";
    if (mode === "WO") return wo || desc;
    if (mode === "WO_DESCRIPTION") return (wo && desc) ? wo + " - " + desc : (wo || desc);
    if (mode === "EQUIPMENT") return task.EVT_OBJECT || task.evt_object || desc || wo;
    if (mode === "TRADE") return task.LISTOFTRADES || task.listoftrades || desc || wo;
    return desc || wo;
  }

  function applyExperienceSizingToGantt() {
    var experience = getConfiguredExperience();
    if (!gantt || !gantt.config) return;
    if (experience.rowDensity === "COMPACT") {
      gantt.config.row_height = 27;
      gantt.config.task_height = 18;
    } else {
      gantt.config.row_height = 35;
      gantt.config.task_height = 23;
    }
    gantt.config.min_task_width = experience.taskBarMinWidth || 0;
  }

  function getTimelineBaseCellClass(date, level) {
    var dateKey = getDateKey(date);
    var config = gGanttGlobal.ganttConfig || {};
    var cacheKey = [
      level,
      dateKey,
      config.highlightWeekends ? 1 : 0,
      config.highlightNationalHolidays ? 1 : 0,
      config.highlightOrgHolidays ? 1 : 0,
      config.highlightShutdownDates ? 1 : 0,
      gGanttGlobal._shutdownDateCacheVersion || 0
    ].join('|');
    var cache = gGanttGlobal._timelineCellClassCache || (gGanttGlobal._timelineCellClassCache = {});
    if (cache.hasOwnProperty(cacheKey)) return cache[cacheKey];

    var cls = [];
    if (config.highlightWeekends && (date.getDay() === 0 || date.getDay() === 6)) cls.push('gantt-weekend-cell');
    if (isUSHoliday(date)) cls.push('gantt-holiday-cell');
    if (isOrganizationHoliday(date)) cls.push('gantt-org-holiday-cell');
    if (isOrganizationSpecialDay(date)) cls.push('gantt-org-special-day-cell');
    if (isShutdownDate(date)) cls.push('gantt-shutdown-cell');
    cache[cacheKey] = cls.join(' ');
    return cache[cacheKey];
  }

  function safeHtml(value) {
    return String(Ext.isEmpty(value) ? '-' : value).replace(/[&<>"']/g, function(ch) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
    });
  }

  function ensureProfessionalPopupStyles() {
    // Styles moved to IUXHUB_CSS.css under IUXHUB_MOVED_FROM_JS.
  }

  // ==========================================================================
  // 04. Shared Scheduling, Date, and Highlight Helpers
  // ==========================================================================
  function parseGanttDateValue(value) {
    if (value instanceof Date) return new Date(value);
    if (typeof value === 'string') {
      var cleanValue = value.split('T')[0];
      var parts = cleanValue.split('-');
      if (parts.length === 3) {
        if (parts[0].length === 4) return new Date(parts[0], parts[1] - 1, parts[2]);
        return new Date(parts[2], parts[1] - 1, parts[0]);
      }
    }
    return new Date(value);
  }

  function getTaskScheduledEndDate(task) {
    if (!task) return null;
    if (task.end_date) {
      var ganttEnd = parseGanttDateValue(task.end_date);
      if (!isNaN(ganttEnd.getTime())) {
        ganttEnd.setDate(ganttEnd.getDate() - 1);
        return ganttEnd;
      }
    }
    if (!Ext.isEmpty(task.EVT_SCHEDEND)) return parseGanttDateValue(task.EVT_SCHEDEND);
    return null;
  }

  function isDueDateExceeded(task) {
    if (!task || Ext.isEmpty(task.EVT_DUE)) return false;
    var dueDate = parseGanttDateValue(task.EVT_DUE);
    var schedEnd = getTaskScheduledEndDate(task);
    if (!schedEnd || isNaN(dueDate.getTime()) || isNaN(schedEnd.getTime())) return false;
    dueDate = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
    schedEnd = new Date(schedEnd.getFullYear(), schedEnd.getMonth(), schedEnd.getDate());
    return schedEnd > dueDate;
  }

  function toGanttExclusiveEndDate(inclusiveEndDate) {
    var end = new Date(inclusiveEndDate);
    end.setDate(end.getDate() + 1);
    return end;
  }

  function rebuildShutdownDateCache(tasks) {
    gGanttGlobal._shutdownDateCache = {};
    gGanttGlobal._shutdownDateCacheVersion = (gGanttGlobal._shutdownDateCacheVersion || 0) + 1;
    gGanttGlobal._timelineCellClassCache = {};
    if (!tasks || !tasks.forEach) return;

    tasks.forEach(function(task) {
      if (Ext.isEmpty(task.PRJ_SHUTDOWN)) return;

      var useCurrentDates = task.modified && task.start_date && task.end_date;
      var start = useCurrentDates ? new Date(task.start_date) : (task.originalStart ? new Date(task.originalStart) : new Date(task.EVT_TARGET));
      var end = useCurrentDates ? new Date(new Date(task.end_date).getTime() - 1) : (task.originalEnd ? new Date(task.originalEnd) : new Date(task.EVT_SCHEDEND));
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return;

      start = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      end = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      if (end < start) {
        var tmp = start;
        start = end;
        end = tmp;
      }

      for (var d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        gGanttGlobal._shutdownDateCache[getDateKey(d)] = true;
      }
    });
  }

  function rebuildShutdownDateCacheFromGantt() {
    var tasks = [];
    if (typeof gantt === 'undefined' || !gantt.eachTask) return;
    gantt.eachTask(function(task) {
      tasks.push(task);
    });
    rebuildShutdownDateCache(tasks);
  }

  function isShutdownDate(date) {
    if (!gGanttGlobal.ganttConfig.highlightShutdownDates) return false;
    return !!gGanttGlobal._shutdownDateCache[getDateKey(date)];
  }

  // ==========================================================================
  // 05. Resources Panel
  // ==========================================================================
  function addResourcePanelDailyValue(map, dateKey, value) {
    if (!dateKey) return;
    map[dateKey] = analyticsNumber(map[dateKey]) + analyticsNumber(value);
  }

  function getResourceEmployeeKey(employee) {
    return analyticsText(employee).toUpperCase();
  }

  function getResourceShiftKey(shift) {
    return analyticsText(shift || 'No Shift') || 'No Shift';
  }

  function getResourcePanelTasks() {
    var tasks = [];
    if (typeof gantt !== 'undefined' && gantt.eachTask) {
      gantt.eachTask(function(task) { tasks.push(task); });
    } else {
      tasks = gGanttGlobal.WorkOrderData || [];
    }
    return tasks || [];
  }

  function buildResourcePanelAssignmentIndex() {
    var byEmployeeDate = {};
    getResourcePanelTasks().forEach(function(task) {
      var employeeKey = getResourceEmployeeKey(task.EVT_PERSON || task.evt_person);
      if (!employeeKey) return;
      var start = getTaskScheduleStartDate(task) || analyticsDate(task.start_date || task.originalStart || task.EVT_TARGET || task.evt_target);
      var end = getTaskScheduleEndInclusiveDate(task) || analyticsDate(task.originalEnd || task.EVT_SCHEDEND || task.evt_schedend || task.end_date || start);
      if (!start) return;
      if (!end) end = start;
      var totalHours = analyticsNumber(task.ACT_EST || task.act_est);
      var days = analyticsDaysBetween(start, end);
      var perDayHours = days > 0 ? totalHours / days : totalHours;
      analyticsEachDay(start, end, function(day) {
        var dateKey = analyticsDateKey(day);
        if (!dateKey) return;
        addResourcePanelDailyValue(byEmployeeDate, employeeKey + '|' + dateKey, perDayHours);
      });
    });
    return byEmployeeDate;
  }

  function buildResourcePanelAvailabilityIndex() {
    var shifts = {};
    var employeeShiftByDate = {};

    (gGanttGlobal.ResourceData || []).forEach(function(row) {
      var employee = analyticsText(row.EMPLOYEE_CODE || row.employee_code || row.PERSON || row.person);
      var employeeKey = getResourceEmployeeKey(employee);
      var dateKey = analyticsDateKey(row.AVAILABILITY_DATE || row.availability_date);
      if (!employeeKey || !dateKey) return;

      var shift = getResourceShiftKey(row.SHIFT || row.shift);
      var shiftHours = analyticsNumber(row.SHIFT_HOURS || row.shift_hours);
      var exceptionHours = analyticsNumber(row.EXCEPTION_HOURS || row.exception_hours);
      var availableHours = shiftHours
        ? Math.max(0, shiftHours - exceptionHours)
        : analyticsNumber(row.AVAILABLE_HOURS || row.available_hours);

      if (!shifts[shift]) {
        shifts[shift] = {
          id: 'SHIFT|' + shift,
          shift: shift,
          text: shift,
          type: 'shift',
          parent: 0,
          open: true,
          employees: {}
        };
      }

      var shiftNode = shifts[shift];
      if (!shiftNode.employees[employeeKey]) {
        shiftNode.employees[employeeKey] = {
          id: 'EMP|' + shift + '|' + employeeKey,
          text: employee,
          type: 'employee',
          parent: shiftNode.id,
          open: true,
          employeeCode: employee,
          employeeKey: employeeKey,
          description: analyticsText(row.DESCRIPTION || row.description || row.EMPLOYEE_DESC || row.employee_desc),
          trade: analyticsText(row.TRADE || row.trade),
          organization: analyticsText(row.ORGANIZATION || row.organization),
          dailyStats: {},
          days: {}
        };
      }

      var employeeNode = shiftNode.employees[employeeKey];
      if (!employeeNode.dailyStats[dateKey]) employeeNode.dailyStats[dateKey] = { assigned: 0, available: 0 };
      employeeNode.dailyStats[dateKey].available += availableHours;
      employeeNode.days[dateKey] = true;
      employeeShiftByDate[employeeKey + '|' + dateKey] = shift;
    });

    return {
      shifts: shifts,
      employeeShiftByDate: employeeShiftByDate
    };
  }

  function buildResourcePanelTreeData() {
    var availabilityIndex = buildResourcePanelAvailabilityIndex();
    var assignedByEmployeeDate = buildResourcePanelAssignmentIndex();
    var shifts = availabilityIndex.shifts;

    Object.keys(shifts).forEach(function(shiftCode) {
      var shiftNode = shifts[shiftCode];
      Object.keys(shiftNode.employees).forEach(function(employeeKey) {
        var employeeNode = shiftNode.employees[employeeKey];
        Object.keys(employeeNode.dailyStats).forEach(function(dateKey) {
          employeeNode.dailyStats[dateKey].assigned = analyticsNumber(assignedByEmployeeDate[employeeKey + '|' + dateKey]);
        });
      });
    });

    var resources = [];
    Object.keys(shifts).sort().forEach(function(shiftCode) {
      var shiftNode = shifts[shiftCode];
      shiftNode.employeeList = Object.keys(shiftNode.employees).sort(function(a, b) {
        return shiftNode.employees[a].employeeCode.localeCompare(shiftNode.employees[b].employeeCode);
      }).map(function(key) { return shiftNode.employees[key]; });
      var shiftDailyStats = {};
      var shiftHours = 0;
      var shiftAvailable = 0;
      var shiftAssigned = 0;
      shiftNode.employeeList.forEach(function(employee) {
        Object.keys(employee.dailyStats).forEach(function(dateKey) {
          if (!shiftDailyStats[dateKey]) shiftDailyStats[dateKey] = { assigned: 0, available: 0 };
          shiftDailyStats[dateKey].assigned += analyticsNumber(employee.dailyStats[dateKey].assigned);
          shiftDailyStats[dateKey].available += analyticsNumber(employee.dailyStats[dateKey].available);
        });
      });
      Object.keys(shiftDailyStats).forEach(function(dateKey) {
        shiftAssigned += analyticsNumber(shiftDailyStats[dateKey].assigned);
        shiftAvailable += analyticsNumber(shiftDailyStats[dateKey].available);
      });
      shiftHours = shiftAvailable;

      resources.push({
        id: shiftNode.id,
        text: shiftNode.shift,
        type: 'shift',
        parent: 0,
        open: true,
        employeeCount: shiftNode.employeeList.length,
        shiftHours: shiftHours,
        exceptionHours: 0,
        assignedHours: shiftAssigned,
        availableHours: shiftAvailable,
        dailyStats: shiftDailyStats
      });
      shiftNode.employeeList.forEach(function(employee) {
        var employeeAssigned = 0;
        var employeeAvailable = 0;
        Object.keys(employee.dailyStats).forEach(function(dateKey) {
          employeeAssigned += analyticsNumber(employee.dailyStats[dateKey].assigned);
          employeeAvailable += analyticsNumber(employee.dailyStats[dateKey].available);
        });
        resources.push({
          id: employee.id,
          text: employee.employeeCode,
          type: 'employee',
          parent: shiftNode.id,
          open: true,
          employeeCode: employee.employeeCode,
          description: employee.description,
          trade: employee.trade,
          organization: employee.organization,
          dayCount: Object.keys(employee.days).length,
          shiftHours: employeeAvailable,
          exceptionHours: 0,
          assignedHours: employeeAssigned,
          availableHours: employeeAvailable,
          dailyStats: employee.dailyStats
        });
      });
    });
    return resources;
  }

  function getResourcePanelRows() {
    return buildResourcePanelTreeData();
  }

  function configureResourcePanelStore() {
    if (!isFeatureEnabled('resourcesPanel') || !gantt || !gantt.createDatastore) return null;
    gantt.config.resource_store = 'iux_resource_store';
    gantt.config.resource_property = 'iux_resource_id';
    gantt.config.resource_render_empty_cells = true;
    gantt.config.process_resource_assignments = false;
    var store = null;
    try {
      store = gantt.getDatastore ? gantt.getDatastore(gantt.config.resource_store) : null;
    } catch (e) {
      store = null;
    }
    if (!store) {
      store = gantt.createDatastore({
        name: gantt.config.resource_store,
        type: 'treeDatastore',
        fetchTasks: true,
        initItem: function(item) {
          item.parent = item.parent || gantt.config.root_id || 0;
          item[gantt.config.resource_property] = item.parent;
          item.open = item.open !== false;
          return item;
        }
      });
    }
    return store;
  }

  function assignResourcePanelIdsToTasks(tasks) {
    var employeeShift = {};
    (gGanttGlobal.ResourceData || []).forEach(function(resource) {
      var employee = getResourceEmployeeKey(resource.EMPLOYEE_CODE || resource.employee_code);
      var shift = analyticsText(resource.SHIFT || resource.shift);
      if (employee && shift && !employeeShift[employee]) employeeShift[employee] = shift;
    });
    (tasks || []).forEach(function(task) {
      var employee = getResourceEmployeeKey(task.EVT_PERSON || task.evt_person);
      var shift = analyticsText(task.EVT_SHIFT || task.evt_shift || employeeShift[employee] || 'No Shift') || 'No Shift';
      task.iux_resource_id = employee ? 'EMP|' + shift + '|' + employee : null;
    });
  }

  function getResourcePanelConfig() {
    return {
      columns: [
        {
          name: 'text',
          label: 'Shift / Employee',
          tree: true,
          width: 220,
          template: function(resource) {
            if (resource.type === 'shift') return resource.text + ' (' + (resource.employeeCount || 0) + ')';
            return (resource.employeeCode || resource.text || '-') + (resource.description ? ' ' + resource.description : '');
          }
        },
        { name: 'trade', label: 'Trade', width: 110, template: function(resource) { return resource.type === 'employee' ? (resource.trade || '-') : '-'; } },
        { name: 'shiftHours', label: 'Shift Hrs', width: 85, align: 'right', template: function(resource) { return analyticsHours(resource.shiftHours) + 'h'; } },
        { name: 'exceptionHours', label: 'Exception', width: 85, align: 'right', template: function(resource) { return analyticsHours(resource.exceptionHours) + 'h'; } },
        { name: 'assignedHours', label: 'Assigned', width: 85, align: 'right', template: function(resource) { return analyticsHours(resource.assignedHours) + 'h'; } },
        { name: 'availableHours', label: 'Available', width: 90, align: 'right', template: function(resource) { return '<b>' + analyticsHours(resource.availableHours) + 'h</b>'; } }
      ]
    };
  }

  function configureResourcePanelTemplates() {
    if (!isFeatureEnabled('resourcesPanel') || !gantt || !gantt.templates) return;
    function resolveResourcePanelRow(resource) {
      if (!resource) return null;
      if (resource.dailyStats) return resource;

      var resourceId = resource.id || resource;
      if (resourceId && gantt.getDatastore && gantt.config.resource_store) {
        try {
          var store = gantt.getDatastore(gantt.config.resource_store);
          var storedResource = store && store.getItem ? store.getItem(resourceId) : null;
          if (storedResource) return storedResource;
        } catch (e) {}
      }
      return resource;
    }
    function getResourceCellRangeStats(resource, start, end) {
      resource = resolveResourcePanelRow(resource);
      var dateKey = getFastDateKey(start);
      var endKey = getFastDateKey(end);
      var cacheKey = dateKey + '|' + endKey;
      if (!resource) return { assigned: 0, available: 0 };
      if (!resource._iuxCellStats) resource._iuxCellStats = {};
      if (!resource._iuxCellStats[cacheKey]) {
        var totals = { assigned: 0, available: 0 };
        var startDate = analyticsDate(start);
        var endDate = analyticsDate(end);
        if (startDate && endDate && endDate > startDate) {
          var lastDate = new Date(endDate);
          lastDate.setDate(lastDate.getDate() - 1);
          analyticsEachDay(startDate, lastDate, function(day) {
            var stats = resource.dailyStats && resource.dailyStats[getFastDateKey(day)];
            totals.assigned += analyticsNumber(stats && stats.assigned);
            totals.available += analyticsNumber(stats && stats.available);
          });
        } else {
          var stats = resource.dailyStats && resource.dailyStats[dateKey];
          totals.assigned = analyticsNumber(stats && stats.assigned);
          totals.available = analyticsNumber(stats && stats.available);
        }
        resource._iuxCellStats[cacheKey] = totals;
      }
      return resource._iuxCellStats[cacheKey];
    }
    gantt.templates.resource_cell_value = function(start, end, resource, tasks) {
      var stats = getResourceCellRangeStats(resource, start, end);
      var assigned = analyticsNumber(stats.assigned);
      var available = analyticsNumber(stats.available);
      if (!assigned && !available) return '';
      return analyticsHours(assigned) + ' / ' + analyticsHours(available);
    };
    gantt.templates.resource_cell_class = function(start, end, resource, tasks) {
      var stats = getResourceCellRangeStats(resource, start, end);
      var threshold = getConfiguredExperience().resourceOverloadThresholdHours || 8;
      if (stats.assigned > threshold || stats.available < stats.assigned) return 'iux-resource-cell-over';
      if (stats.available > 0) return 'iux-resource-cell-free';
      return '';
    };
  }

  function updateResourcesPanelDataInPlace() {
    if (!isFeatureEnabled('resourcesPanel') || !gantt || !gantt.getDatastore) return false;
    var store = configureResourcePanelStore();
    if (!store || !store.getItem) return false;

    var rows = getResourcePanelRows();
    var updated = 0;
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var existing = null;
      try {
        existing = store.getItem(row.id);
      } catch (e) {
        existing = null;
      }
      if (!existing) return false;

      row[gantt.config.resource_property] = row.parent || gantt.config.root_id || 0;
      Object.keys(existing).forEach(function(key) {
        if (key.charAt(0) === '$') return;
        if (!row.hasOwnProperty(key)) delete existing[key];
      });
      Object.keys(row).forEach(function(key) {
        existing[key] = row[key];
      });
      existing._iuxCellStats = {};
      updated++;
    }

    if (!updated) return false;
    if (store.refresh) store.refresh();
    else if (gantt.render) gantt.render();
    return true;
  }

  function loadResourcesPanelData(preserveExisting) {
    if (!isFeatureEnabled('resourcesPanel') || !gantt || !gantt.getDatastore) return;
    if (preserveExisting && updateResourcesPanelDataInPlace()) return;
    var store = configureResourcePanelStore();
    if (!store) return;
    store.clearAll();
    store.parse(getResourcePanelRows());
  }

  function scheduleResourcesPanelDataReload(preserveExisting) {
    if (!isFeatureEnabled('resourcesPanel')) return;
    if (gGanttGlobal.ResourcePanelReloadTimer) clearTimeout(gGanttGlobal.ResourcePanelReloadTimer);
    gGanttGlobal.ResourcePanelReloadTimer = setTimeout(function() {
      gGanttGlobal.ResourcePanelReloadTimer = null;
      loadResourcesPanelData(preserveExisting);
    }, preserveExisting ? 120 : 0);
  }

  function getMainGanttLayoutCols(includeHorizontalScrollbars) {
    if (includeHorizontalScrollbars !== false) includeHorizontalScrollbars = true;
    var gridRows = [{
      view: "grid",
      scrollX: "gridScroll",
      scrollable: true,
      scrollY: "scrollVer"
    }];
    var timelineRows = [{
      view: "timeline",
      scrollX: "scrollHor",
      scrollY: "scrollVer"
    }];

    if (includeHorizontalScrollbars) {
      gridRows.push({
        view: "scrollbar",
        id: "gridScroll",
        group: "horizontal"
      });
      timelineRows.push({
        view: "scrollbar",
        id: "scrollHor",
        group: "horizontal"
      });
    }

    return [{
      width: getGanttGridWidthForBulkMode(),
      min_width: getGanttGridWidthForBulkMode(),
      rows: gridRows
    }, {
      resizer: true,
      width: 1
    }, {
      rows: timelineRows
    }, {
      view: "scrollbar",
      id: "scrollVer"
    }];
  }

  function getResourcesGanttLayout() {
    var gridWidth = getGanttGridWidthForBulkMode();
    return {
      css: "gantt_container",
      rows: [{
        cols: [{
          width: gridWidth,
          min_width: gridWidth,
          group: "grids",
          rows: [{
            view: "grid",
            scrollX: "gridScroll",
            scrollable: true,
            scrollY: "scrollVer"
          }]
        }, {
          resizer: true,
          width: 1
        }, {
          rows: [{
            view: "timeline",
            scrollX: "scrollHor",
            scrollY: "scrollVer"
          }]
        }, {
          view: "scrollbar",
          id: "scrollVer",
          group: "vertical"
        }]
      }, {
        resizer: true,
        height: 1
      }, {
        height: 170,
        config: getResourcePanelConfig(),
        cols: [{
          width: gridWidth,
          min_width: gridWidth,
          group: "grids",
          rows: [{
            view: "resourceGrid",
            scrollX: "gridScroll",
            scrollY: "resourceVScroll"
          }]
        }, {
          resizer: true,
          width: 1
        }, {
          view: "resourceTimeline",
          scrollX: "scrollHor",
          scrollY: "resourceVScroll"
        }, {
          view: "scrollbar",
          id: "resourceVScroll",
          group: "vertical"
        }]
      }, {
        height: 18,
        cols: [{
          width: gridWidth,
          min_width: gridWidth,
          group: "grids",
          rows: [{
            view: "scrollbar",
            id: "gridScroll",
            group: "horizontal"
          }]
        }, {
          width: 1
        }, {
          view: "scrollbar",
          id: "scrollHor",
          group: "horizontal"
        }, {
          width: 18
        }]
      }]
    };
  }

  function getDefaultGanttLayout() {
    return {
      css: "gantt_container",
      cols: getMainGanttLayoutCols()
    };
  }

  function syncGanttHostHeight() {
    var host = document.getElementById("expertshub");
    var toolbar = document.getElementById("my_gantt_toolbar");
    var ganttHost = document.getElementById("gantt_here");
    if (!host || !ganttHost) return;

    var parentHeight = host.parentElement ? host.parentElement.clientHeight : 0;
    if (parentHeight > 0) {
      host.style.height = parentHeight + "px";
    }

    var toolbarHeight = toolbar && toolbar.offsetHeight ? toolbar.offsetHeight : 64;
    var ganttHeight = Math.max(320, host.clientHeight - toolbarHeight);
    if (ganttHeight > 0) {
      ganttHost.style.height = ganttHeight + "px";
    }
  }

  function resizeGanttToHost() {
    syncGanttHostHeight();
    if (gantt && gantt.setSizes) {
      gantt.setSizes();
    } else if (gantt && gantt.render) {
      gantt.render();
    }
  }

  function scheduleGanttInitialResize() {
    [0, 50, 150, 350, 700].forEach(function(delay) {
      setTimeout(resizeGanttToHost, delay);
    });

    if (!gGanttGlobal.GanttResizeListenerAttached) {
      gGanttGlobal.GanttResizeListenerAttached = true;
      window.addEventListener("resize", function() {
        setTimeout(resizeGanttToHost, 50);
      });
    }
  }

  function configureGanttTooltip() {
    if (!gantt || !gantt.ext || !gantt.ext.tooltips || !gantt.ext.tooltips.tooltip) return;

    var ganttTooltip = gantt.ext.tooltips.tooltip;
    if (ganttTooltip.hide) {
      try {
        ganttTooltip.hide();
      } catch (e) {}
    }
    if (ganttTooltip.setViewport) {
      var taskData = document.querySelector("#gantt_here .gantt_task_data");
      ganttTooltip.setViewport(taskData || gantt.$task_data || gantt.$task || gantt.$container);
    }
    if (ganttTooltip.config) {
      ganttTooltip.config.timeout_to_display = getConfiguredExperience().tooltipDelayMs;
      ganttTooltip.config.timeout_to_hide = 80;
    }
  }

  function scheduleGanttTooltipConfigure() {
    [0, 50, 150, 350].forEach(function(delay) {
      Ext.defer(configureGanttTooltip, delay);
    });
  }

  // ==========================================================================
  // 06. Gantt Layout and Rendering
  // ==========================================================================
  function renderGanttNow(vInputData, vResourceData) {
    console.log("From renderGanttNow");
    configureResourcePanelStore();
    configureResourcePanelTemplates();
    gantt.config.show_progress = false;
    gantt.config.drag_resize = true;
    gantt.config.show_links = false;
    gantt.config.scale_height = 70;
    gantt.config.min_duration = 24 * 60 * 60 * 1000;
    gantt.config.smart_rendering = !isFeatureEnabled('resourcesPanel');
    gantt.config.static_background = true;
    //gantt.config.show_task_cells = false;
    gantt.config.undo = true;
    gantt.config.redo = true;
    gantt.config.initial_scroll = false;
    gantt.config.grid_resize = false;
    gantt.config.autofit = false;
    gantt.config.sort = true;
    gantt.config.order_branch = false;
    gantt.config.order_branch_free = false;
    gantt.config.keyboard_navigation = false;
    gantt.config.keyboard_navigation_cells = false;
    gantt.config.fit_tasks = true;
    gantt.config.duration_unit = "day";
    applyExperienceSizingToGantt();

//gantt.config.scale_unit = "day";        // top scale
//gantt.config.date_scale = "%d-%m-%Y";   // date format
//gantt.config.subscales = [];            // optional
gantt.config.timeline = true;           // enable timeline mode
//gantt.config.show_task_cells = true;    // show cells in timeline mode


//gantt.config.keep_grid_header = true; // prevents header rebuild on resize




    gantt.config.grid_background = "#F0F0F0";
    gantt.config.task_background = "#F0F0F0";

    gantt.config.layout = isFeatureEnabled('resourcesPanel') ? getResourcesGanttLayout() : getDefaultGanttLayout();

// Fix for column filters disappearing on resizer drag
      // Store filter values before resize and restore after
      var storedFilterValues = {};
      
      // Save current filter values
      function saveFilterValues() {
        if (filterManager && filterManager.filters) {
          for (var i = 0; i < filterManager.filters.length; i++) {
            var filter = filterManager.filters[i];
            var input = document.querySelector('input[data-text-filter="' + filter.columnName + '"]');
            if (input) {
              storedFilterValues[filter.columnName] = input.value;
            }
          }
        }
      }
      
      // Restore filter values after resize
      function restoreFilterValues() {
        if (filterManager && filterManager.filters) {
          for (var i = 0; i < filterManager.filters.length; i++) {
            var filter = filterManager.filters[i];
            var input = document.querySelector('input[data-text-filter="' + filter.columnName + '"]');
            if (input && storedFilterValues[filter.columnName]) {
              input.value = storedFilterValues[filter.columnName];
              filter.value = storedFilterValues[filter.columnName];
            }
          }
        }
      }
      
      // Attach event handlers for grid resize (resizer between grid and timeline)
      gantt.attachEvent("onGridResizeEnd", function(old_width, new_width){
        console.log('Grid resize ended. Restoring filters...');
        // Use setTimeout to ensure DOM is ready after resize
        setTimeout(function() {
          restoreFilterValues();
          gantt.render();
        }, 10);
        return true;
      });
      
      // Also handle during resize to save values before they disappear
      gantt.attachEvent("onGridResizeStart", function(old_width, new_width){
        console.log('Grid resize started. Saving filter values...');
        saveFilterValues();
        return true;
      });
      
// Fix for column filters disappearing on resizer drag
    

    gantt.config.undo_actions = {
      move: true, // enable undo/redo for moving tasks
      update: true, // enable undo/redo for updating task details
      link: false, // enable undo/redo for creating/deleting task links
      add: false, // enable undo/redo for adding new tasks
      delete : false // enable undo/redo for deleting tasks
    };

    gantt.plugins({
      tooltip: true,
      export_api: true
    });
    scheduleGanttTooltipConfigure();
    gantt.templates.grid_folder = function (item) { return ""; };
    gantt.templates.grid_file   = function (item) { return ""; };
    gantt.templates.grid_row_class = function(start, end, task) {
      return getGanttAlternateRowClass(task || start);
    };
    gantt.templates.task_row_class = function(start, end, task) {
      return getGanttAlternateRowClass(task || start);
    };

    gantt.templates.tooltip_text = function (start, end, task) {
      if (gGanttGlobal.contextMenuOpen) return "";

      function formatDueDate(value) {
        var match = String(value || "").match(/^(\d{2})-(\d{2})-(\d{4})$/);
        if (!match) return value || "-";

        var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        var monthIndex = Number(match[2]) - 1;
        if (monthIndex < 0 || monthIndex > 11) return value;

        return match[1] + "-" + monthNames[monthIndex] + "-" + match[3].slice(-2);
      }

      function row(extra, col1lbl, col1val, col2lbl, col2val) {
        var r = "<tr" + (extra ? " class='iux-task-tooltip-sep'" : "") + ">";
        r += "<td class='iux-task-tooltip-label'>" + safeHtml(col1lbl) + "</td><td class='iux-task-tooltip-value'>" + safeHtml(col1val || "-") + "</td>";
        if (col2lbl !== undefined) {
          r += "<td class='iux-task-tooltip-label iux-task-tooltip-label-right'>" + safeHtml(col2lbl) + "</td><td class='iux-task-tooltip-value'>" + safeHtml(col2val || "-") + "</td>";
        }
        r += "</tr>";
        return r;
      }

      var vHTML = "<div class='iux-task-tooltip'>";

      // Header
      vHTML += "<div class='iux-task-tooltip-head'>";
      vHTML += "<span class='iux-task-tooltip-code'>" + safeHtml(task.EVT_CODE || task.id || "-") + "</span>";
      vHTML += "<span class='iux-task-tooltip-title'>" + safeHtml(task.EVT_DESC || "") + "</span>";
      vHTML += "</div>";

      // Body table
      vHTML += "<table class='iux-task-tooltip-table'>";
      vHTML += row(false, "Object:",       task.EVT_OBJECT || "-",                  "Organization:", task.EVT_OBJECT_ORG || "-");
      vHTML += row(true,  "Location:",     task.OBJ_LOCATION  || "-",               "Org:",          task.EVT_ORG || "-");
      vHTML += row(true,  "Status:",       (task.EVT_STATUS_DESC || task.EVT_STATUS) || "-",               "Type:",         task.EVT_JOBTYPE || "-");
      vHTML += row(true,  "Due Date:",     formatDueDate(task.EVT_DUE),             "PM Code:",      task.EVT_PPM || "-");
      vHTML += row(true,  "Est. Hours:",   task.ACT_EST       || "-",               "Trades:",       task.LISTOFTRADES || "-");
      vHTML += row(true,  "Shutdown Code: ", task.PRJ_SHUTDOWN || " -",               "No. of People:", task.ACT_PERSONS || "-");
      vHTML += "</table></div>";

      return vHTML;
    };

    // Weekend / holiday cell highlighting — checks gGanttGlobal.ganttConfig flags on every render
    gantt.templates.timeline_cell_class = function(task, date) {
      if (!gantt.ext || !gantt.ext.zoom) return '';
      var level = gantt.ext.zoom.getCurrentLevel();
      if (level !== 0 && level !== 1) return '';

      var baseClass = getTimelineBaseCellClass(date, level);
      var rowClass = getGanttAlternateRowClass(task);
      if (rowClass) baseClass = baseClass ? baseClass + ' ' + rowClass : rowClass;
      if (gGanttGlobal.ganttConfig.highlightDueDates && task && getTaskCustomerSpecificDateKey(task) === getDateKey(date)) {
        return baseClass ? baseClass + ' highlight-cell' : 'highlight-cell';
      }
      return baseClass;
    };


    gantt.templates.scale_cell_class = function(date) {
      // Highlighting only applies on the Day scale; all other scales are unaffected
      if (!gantt.ext || !gantt.ext.zoom || gantt.ext.zoom.getCurrentLevel() !== 0) return '';
      var cls = [];
      if (gGanttGlobal.ganttConfig.highlightWeekends && (date.getDay() === 0 || date.getDay() === 6)) {
        cls.push('gantt-weekend-scale');
      }
      if (isUSHoliday(date)) cls.push('gantt-holiday-scale');
      if (isOrganizationHoliday(date)) cls.push('gantt-org-holiday-scale');
      if (isOrganizationSpecialDay(date)) cls.push('gantt-org-special-day-scale');
      if (isShutdownDate(date)) cls.push('gantt-shutdown-scale');
      return cls.join(' ');
    };

    gantt.templates.scale_row_class = function(scale) { return ''; };

    gantt.templates.task_text = function(start, end, task) {
      var text = safeHtml(getConfiguredTaskText(task));
      if (gGanttGlobal.ganttConfig.highlightDueDateFlags && task.EVT_DUE) {
        text += '<span class="gantt-due-date-flag" title="Due Date: ' + task.EVT_DUE + '"><i class="fa fa-flag"></i></span>';
      }
      return text;
    };

    gantt.attachEvent("onBeforeTaskDisplay", function (id, task) {
      var task = gantt.getTask(id);
      var vStatus = task.EVT_STATUS;
      if (isReadonlyStatusTask(task)) {
        task.readonly = true;
        task.drag_resize = false;
      }
      var isVisibleBySummary = (task._summaryVisible === false) ? false : true;
      var isVisibleByColumn = (task._columnVisible === false) ? false : true;
      return isVisibleBySummary && isVisibleByColumn && isSearchSuccess(id, task);
    });
    

    if (Ext.isEmpty(vInputData)) {
      EAM.Messaging.showConfirmation("No data found for the search criteria. Please change options and try again.");
      if (gantt.getTaskCount() > 0)
        gantt.clearAll();
      return;
    }
    var vInputWOArray = JSON.parse(vInputData);
    var vInputResourceArray = [];
    try {
      vInputResourceArray = Ext.isEmpty(vResourceData) ? [] : JSON.parse(vResourceData);
    } catch (e) {
      console.warn("Unable to parse resource analytics data.", e);
      vInputResourceArray = [];
    }
    gGanttGlobal.ResourceData = vInputResourceArray;

    var today = normalizeGanttDateStart(new Date()); // get the current date at day start
    var nextMonth = new Date(today); // create a new date object
    nextMonth.setDate(today.getDate() + 30);

    var GANTTStartDate = today;
    var GANTTMaxDate = nextMonth;

    var startDateCmp = Ext.getCmp('StartDate');
    GANTTStartDate = normalizeGanttDateStart(startDateCmp ? (startDateCmp.rawDate || startDateCmp.value) : today);
    if (Ext.isEmpty(GANTTStartDate) || isNaN(GANTTStartDate.getTime()))
      GANTTStartDate = today;

    gantt.config.start_date = new Date(GANTTStartDate);

    result = [];

    vInputWOArray.forEach((obj, index) => {
      var vStartDate = new Date(obj.EVT_TARGET);
      var vStartDateFormat = formatDateForGantt(vStartDate);
      var vEndDate = new Date(obj.EVT_SCHEDEND);
      obj.id = obj.EVT_CODE + '-' + obj.FUTURE_SEQUNCE;
      obj.start_date = vStartDateFormat;
      // Store true original DB dates so the Review popup always shows real Old dates,
      // even for overdue WOs whose start_date is clamped to GANTTStartDate below.
      obj.originalStart = new Date(vStartDate);
      obj.originalEnd   = new Date(vEndDate);
      obj.duration = Math.ceil((vEndDate - vStartDate) / (1000 * 60 * 60 * 24)) + 1;
      obj.text = obj.EVT_DESC;
      obj.EVT_TARGET = formatDateForGantt(vStartDate);
      obj.EVT_SCHEDEND = formatDateForGantt(vEndDate);
      if (!Ext.isEmpty(obj.EVT_DUE)) {
        obj.EVT_DUE = formatDateForGantt(new Date(obj.EVT_DUE));
      }
      if (!Ext.isEmpty(obj.EVT_UDFDATE01)) {
        obj.EVT_UDFDATE01 = formatDateForGantt(new Date(obj.EVT_UDFDATE01));
      }
      if (!Ext.isEmpty(obj.EVT_UDFDATE02)) {
        obj.EVT_UDFDATE02 = formatDateForGantt(new Date(obj.EVT_UDFDATE02));
      }

      if (vEndDate > GANTTMaxDate) {
        GANTTMaxDate = vEndDate;
      }

      if (result[vStartDate]) {
        result[vStartDate] += parseFloat(obj.ACT_EST);
      } else {
        result[vStartDate] = parseFloat(obj.ACT_EST);
      }

      /* Add Descriptions to codes */
      var index = gGanttGlobal.WorkorderStatusStore.findExact('code', obj.EVT_STATUS);
      if (index !== -1) {
        var item = gGanttGlobal.WorkorderStatusStore.getAt(index);
        obj.EVT_STATUS_DESC = item.get('description');
      } else {
        if (obj.EVT_STATUS == 'FWP')
          obj.EVT_STATUS_DESC = "Future PM";
        if (obj.EVT_STATUS == 'FWD')
          obj.EVT_STATUS_DESC = "Future PM Duplicate";
        if (obj.EVT_STATUS == 'FWM')
          obj.EVT_STATUS_DESC = "Future MP";
      }

      index = gGanttGlobal.WorkorderTypeStore.findExact('code', obj.EVT_JOBTYPE);
      if (index !== -1) {
        var item = gGanttGlobal.WorkorderTypeStore.getAt(index);
        obj.EVT_JOBTYPE_DESC = item.get('description');
      }

      obj.color = getColor(obj.EVT_STATUS, obj.EVT_JOBTYPE);
      if (vStartDate < GANTTStartDate) {
        // Over Due work orders
        obj.textColor = 'RED';
        obj.start_date = formatDateForGantt(GANTTStartDate);
      }

      var ppm_perioduom_desc = "";
      switch (obj.PPM_PERIODUOM) {
      case "D":
        ppm_perioduom_desc = "Day(s)";
        break;
      case "M":
        ppm_perioduom_desc = "Month(s)";
        break;
      case "Y":
        ppm_perioduom_desc = "Year(s)";
        break;
      case "W":
        ppm_perioduom_desc = "Week(s)";
        break;
      default:
        ppm_perioduom_desc = "-";
      }
      obj.PERIODUOM_DESC = obj.PPM_FREQ + ' ' + ppm_perioduom_desc;

    });

    assignResourcePanelIdsToTasks(vInputWOArray);

    gGanttGlobal.EstimatedHours = result;
    gGanttGlobal.WorkOrderData = vInputWOArray;
    rebuildShutdownDateCache(vInputWOArray);

    if (Ext.getCmp("lookahead").value == "WEEK") {
      GANTTMaxDate = new Date(GANTTMaxDate.setMonth(GANTTMaxDate.getMonth() + 1));
    } else if (Ext.getCmp("lookahead").value == "MONTH") {
      GANTTMaxDate = new Date(GANTTMaxDate.setMonth(GANTTMaxDate.getMonth() + 2));
    } else if (Ext.getCmp("lookahead").value == "QUARTER") {
      GANTTMaxDate = new Date(GANTTMaxDate.setMonth(GANTTMaxDate.getMonth() + 2));
    } else if (Ext.getCmp("lookahead").value == "YEAR") {
      GANTTMaxDate = new Date(GANTTMaxDate.setMonth(GANTTMaxDate.getMonth() + 4));
    } else if (Ext.getCmp("lookahead").value == "2YEAR") {
      GANTTMaxDate = new Date(GANTTMaxDate.setMonth(GANTTMaxDate.getMonth() + 4));
    } else {
      GANTTMaxDate = new Date(GANTTMaxDate.setMonth(GANTTMaxDate.getMonth() + 1));
    }

    gantt.config.end_date = GANTTMaxDate;

    gGanttGlobal.GANTTStartDate = GANTTStartDate;
    gGanttGlobal.GANTTMaxDate = GANTTMaxDate;
    
    
    
    applyBulkEditColumn(false);
    function IUXHUB_applyFilter(filterManager, vColumnName, dataType)
    {
    if (vColumnName === "IUX_BULK_SELECT") return;
    if (vColumnName === "IUX_WO_INDICATOR") return;
    
    if (!Ext.isEmpty(gGanttGlobal.ListColumnsStore.find(element => element['name'] === vColumnName))){
      var currentLable = gGanttGlobal.ListColumnsStore.find(element => element['name'] === vColumnName).label;
      if (Ext.isEmpty(dataType)){
      gGanttGlobal.ListColumnsStore.find(element => element['name'] === vColumnName).label = currentLable + '<div data-text-filter></div>';
        filterManager.addFilter(new TextFilter(vColumnName, gantt)); 
      }
      else {
      gGanttGlobal.ListColumnsStore.find(element => element['name'] === vColumnName).label = currentLable + '<div data-date-filter></div>';
        filterManager.addFilter(new DateFilter(vColumnName, gantt)); 
      }
      
    }
    }

    filterManager = {};
    filterManager = new FilterManager(gantt); 
    
    gantt.config.columns.forEach(function(column) {
      IUXHUB_applyFilter(filterManager, column.name, column.dataType); 
    })
    
    
      gantt.config.columns = gGanttGlobal.ListColumnsStore;
    filterManager.init();

    gantt.init("gantt_here");
    scheduleGanttTooltipConfigure();
    
    

    // Clear all data from the Gantt chart
    if (gantt.getTaskCount() > 0)
      gantt.clearAll();

    gantt.parse({
      data: vInputWOArray
    });

    gantt.eachTask(function(task) {
      task._summaryVisible = true;
      task._columnVisible = true;
    });

    gantt.sort('start_date', false);
    scheduleGanttTooltipConfigure();
    loadResourcesPanelData();
    updateHeader();
    scheduleGanttInitialResize();

    gantt.attachEvent("onBeforeTaskUpdate", function(id, task) {
      if (gGanttGlobal.suppressChangeTracking) return true;
      // Capture original dates only on the very first modification.
      // For overdue WOs start_date is clamped to GANTTStartDate for display,
      // so prefer the true originalStart/originalEnd stored during parse.
      if (!gGanttGlobal.PendingChanges[id]) {
        var currentTask = gantt.getTask(id);
        gGanttGlobal.PendingChanges[id] = {
          oldStart : currentTask.originalStart ? new Date(currentTask.originalStart) : new Date(currentTask.start_date),
          oldEnd   : currentTask.originalEnd   ? new Date(currentTask.originalEnd)   : new Date(currentTask.end_date),
          woCode   : currentTask.EVT_CODE,
          woOrg    : currentTask.EVT_ORG
        };
      }
      return true;
    });

    gantt.attachEvent("onAfterTaskUpdate", function (id, task, is_new) {
      if (gGanttGlobal.suppressChangeTracking) return;
      var t = gantt.getTask(id);
      if (!gGanttGlobal.PendingChanges[id]) {
        gGanttGlobal.PendingChanges[id] = { woCode: t.EVT_CODE, woOrg: t.EVT_ORG };
      }
      gGanttGlobal.PendingChanges[id].newStart = new Date(t.start_date);
      gGanttGlobal.PendingChanges[id].newEnd   = new Date(t.end_date);
      gGanttGlobal.TasksModified.push(id);
      gGanttGlobal.TasksModified = Array.from(new Set(gGanttGlobal.TasksModified));
      gantt.getTask(id).modified = 1;
      Ext.getCmp("submitGanttNow").addCls('highlight-button');
      rebuildShutdownDateCacheFromGantt();
      if (isFeatureEnabled('resourcesPanel')) {
        scheduleResourcesPanelDataReload(true);
      } else {
        gantt.render();
      }
      updateHeader();
    });
    /*
    gantt.attachEvent("onBeforeTaskUpdate", function(id, task){
    var vStatus = gantt.getTask(id).EVT_STATUS;
    if(vStatus == 'FWD' || vStatus == 'FWP' || vStatus == 'FWM'){
    return false;
    }
    return true;
    });
    */

    // ------------------------------------------------------------------------
    // 07. Context Menu and Task Details
    // ------------------------------------------------------------------------
    gantt.attachEvent("onContextMenu", function (id) {
      gGanttGlobal.contextMenuOpen = true;
      if (Ext.isEmpty(id)) {
        gGanttGlobal.contextMenuOpen = false;
        return;
      }

      try {
        gantt.ext.tooltips.tooltip.hide();
      } catch (e) {
        console.log("Tooltip not closed");
      }

      if (Ext.getCmp('GanttMenuContext')) {
        try {
          Ext.getCmp('GanttMenuContext').destroy();
        } catch (err) {}
      }

      var MenuItems = [];
      var task = gantt.getTask(id);
      var vStatus = task.EVT_STATUS;
      if (isFeatureEnabled('bulkEdit') && gGanttGlobal.ganttConfig.bulkEditEnabled) {
        var bulkSelectedCount = getBulkSelectedTasks().length;
        var bulkBlockedReason = !isBulkEditableTask(task)
          ? "Bulk Edit is not available for this work order status"
          : (bulkSelectedCount === 0 ? "Select one or more work orders first" : "");
        MenuItems.push({
          id: "BULK_QUICK_UPDATE",
          text: bulkBlockedReason ? "Quick Bulk Edit - " + bulkBlockedReason : "Quick Bulk Edit",
          disabled: !Ext.isEmpty(bulkBlockedReason)
        });
      } else if (isFutureEventTask(task)) {
        MenuItems.push({
          id: "PREVIEW_FUTURE_WORK_ORDER",
          text: "Preview Work Order"
        });
      // MenuItems.push({
      //   id: "RELEASE_FUTURE_WORK_ORDER",
      //   text: "Release Future Work Order"
      // });
      } else if (isReadonlyStatusTask(task)) {
        MenuItems.push({
          id: "WORK_ORDER_HYPERLINK",
          text: "Open Work Order"
        });
      } else {
        MenuItems.push({
          id: "WORK_ORDER_HYPERLINK",
          text: "Open Work Order"
        });
        MenuItems.push({
          id: "WORK_ORDER_QUICK_UPDATE",
          text: "Quick Update"
        });
        if (isFeatureEnabled('shiftPopup')) {
          MenuItems.push({
            id: "WORK_ORDER_SHIFT_ASSIGNMENT",
            text: "Assign Shift"
          });
        }

      }
      var menu = new Ext.menu.Menu({
        id: 'GanttMenuContext',
        items: MenuItems,
        listeners: {
          hide: function () {
            gGanttGlobal.contextMenuOpen = false;
          },
          click: function (item, clickedItem) {
            if (Ext.isEmpty(id)) {
              return false;
            }
            if (!clickedItem || clickedItem.disabled) {
              return false;
            }

            if (clickedItem.id == "WORK_ORDER_HYPERLINK") {
              var vParameters = {};
              vParameters.SYSTEM_FUNCTION_NAME = 'WSJOBS';
              vParameters.USER_FUNCTION_NAME = 'WSJOBS';
              vParameters.CURRENT_TAB_NAME = "HDR";
              vParameters.initpath = "WSJOBS";
              vParameters.filterfields = "workordernum";
              vParameters.filteroperator = encodeURIComponent("=");
              vParameters.filtervalue = task.EVT_CODE;
              openHyperlink(vParameters);
            } else if (clickedItem.id == "WORK_ORDER_QUICK_UPDATE") {
              processQuickPopup(id);
            }
            else if (clickedItem.id == "WORK_ORDER_SHIFT_ASSIGNMENT") {
              showShiftAssignmentPopup(id);
            }
            else if (clickedItem.id == "BULK_QUICK_UPDATE") {
              if (!isFeatureEnabled('bulkEdit')) return false;
              if (getBulkSelectedTasks().length === 0) {
                EAM.Messaging.showConfirmation('Select one or more work orders in the Bulk Edit checkbox column first.');
                return false;
              }
              showBulkQuickEditPopup();
            }


            if (clickedItem.id == "PREVIEW_FUTURE_WORK_ORDER") {

              // if (Ext.isEmpty(gantt.getTask(id).evt_ppopk.replaceAll(",", ""))) {
              //   EAM.Messaging.showConfirmation("Preview is not applicable as selected record is not type PM");
              // }
          var veventcode=gantt.getTask(id).EVT_PPOPK;

              var vPMPreviewData = EAM.Ajax.request({
                url: "EWSUSR.xmlhttp",
                params: {
                    GRID_NAME: "AUPREV",
                    USER_FUNCTION_NAME: "AUPREV",
                    SYSTEM_FUNCTION_NAME: "EWSUSR",
                    CURRENT_TAB_NAME: "LST",
                    COMPONENT_INFO_TYPE: "DATA_ONLY", 
          MADDON_FILTER_ALIAS_NAME_1: 'evt_code',
          MADDON_FILTER_OPERATOR_1: '=',
          MADDON_FILTER_JOINER_1: 'AND',
          MADDON_FILTER_SEQNUM_1: '1',
          MADDON_FILTER_VALUE_1: veventcode
                }
              }).responseData.pageData.grid.GRIDRESULT.GRID.DATA;


              ensureProfessionalPopupStyles();
              var pmRecord = (vPMPreviewData && vPMPreviewData.length > 0) ? vPMPreviewData[0] : {};

              var PMHeader = Ext.create('Ext.container.Container', {
                width: 800,
                name: "PMHeader",
                margin: '0 0 12 0',
                html:
                  '<div class="gantt-preview-card">' +
                    '<div class="gantt-preview-hero">' +
                      '<div>' +
                        '<div class="gantt-preview-title">PM ' + safeHtml(pmRecord.evt_ppm) + '</div>' +
                        '<div class="gantt-preview-desc">' + safeHtml(pmRecord.evt_desc) + '</div>' +
                      '</div>' +
                      '<div class="gantt-popup-statbar" style="justify-content:flex-end;">' +
                        '<div class="gantt-popup-stat"><strong>' + safeHtml(pmRecord.evt_freq) + '</strong><span>Frequency</span></div>' +
                        '<div class="gantt-popup-stat"><strong>' + safeHtml(pmRecord.ppm_duration) + '</strong><span>Duration</span></div>' +
                      '</div>' +
                    '</div>' +
                    '<div class="gantt-preview-fields">' +
                      '<div class="gantt-preview-field"><span>PM Code</span><strong>' + safeHtml(pmRecord.evt_ppm) + '</strong></div>' +
                      '<div class="gantt-preview-field"><span>Issue Type</span><strong>' + safeHtml(pmRecord.ppm_isstype) + '</strong></div>' +
                      '<div class="gantt-preview-field"><span>Schedule Group</span><strong>' + safeHtml(pmRecord.ppm_schedgrp) + '</strong></div>' +
                    '</div>' +
                  '</div>'
              });




              var objectPanel = Ext.create('Ext.grid.Panel', {
                title: '<b>Objects Covered</b>',
                width: 800,
                height: 280,
                margin: '0 0 12 0',
                bodyPadding: 0,
                columnLines: true,
                stripeRows: true,
                columns: [{
                    text: 'Type',
                    dataIndex: 'value1',
                    width: 90
                  }, {
                    text: 'Object',
                    dataIndex: 'value2',
                    width: 110
                  }, {
                    text: 'Description',
                    dataIndex: 'value3',
                    flex: 1
                  }, {
                    text: 'Position ID',
                    dataIndex: 'value5',
                    width: 100
                  }, {
                    text: 'Physical ID',
                    dataIndex: 'value6',
                    width: 100
                  }, {
                    text: 'Serial Number',
                    dataIndex: 'value11',
                    width: 120
                  }
                ],

                plugins: [{
                    ptype: 'rowexpander',
                    id: 'rowexpander',
                    iconCls: 'fa fa-search',
                    rowBodyTpl: '<table style="width:100%;padding:10px;border-collapse:collapse;"><tr><td style="padding:4px 8px;"><b>Legacy Tag</b></td><td style="padding:4px 8px;">:</td><td style="padding:4px 8px;">{value4}</td></tr>' +
                    '<tr><td style="padding:4px 8px;"><b>Class Survey</b></td><td style="padding:4px 8px;">:</td><td style="padding:4px 8px;">{value7}</td></tr>' +
                    '<tr><td style="padding:4px 8px;"><b>CSA</b></td><td style="padding:4px 8px;">:</td><td style="padding:4px 8px;">{value8}</td></tr>' +
                    '<tr><td style="padding:4px 8px;"><b>Manufacturer</b></td><td style="padding:4px 8px;">:</td><td style="padding:4px 8px;">{value9}</td></tr>' +
                    '<tr><td style="padding:4px 8px;"><b>Manufacturer Model</b></td><td style="padding:4px 8px;">:</td><td style="padding:4px 8px;">{value10}</td></tr>' +
                    '<tr><td style="padding:4px 8px;"><b>Location</b></td><td style="padding:4px 8px;">:</td><td style="padding:4px 8px;">{value12}</td></tr>' +
                    '<tr><td style="padding:4px 8px;"><b>Location Detail</b></td><td style="padding:4px 8px;">:</td><td style="padding:4px 8px;">{value13}</td></tr></table>'
                  }

                ],
              listeners: {
                    viewready: function (grid) {
                      var expander = grid.getPlugin('rowexpander');
                      grid.store.each(function (record, index) {
                        expander.toggleRow(index, record);
                    });
                    }
                },

                store: {
                    fields: ['value1', 'value2', 'value3', 'value4','value5','value6', 'value7', 'value8', 'value9', 'value10', 'value11','value12','value13'], // Add more fields as needed
                    data: [] 
                }
            });
                var transformedData = [];
                if (vPMPreviewData.length > 0) {
                    // Extract the first row of data
                    var firstRow = vPMPreviewData[0];
                //vPMPreviewData.forEach(function(item) {
                    var rowData = {
                        value1: firstRow.value1,
                        value2: firstRow.evt_object,
                        value3: firstRow.obj_desc,
                        value4: firstRow.value4,
                        value5: firstRow.obj_udfchar15,
                        value7: firstRow.obj_udfchar06,
                        value8: firstRow.value8,
                        value9: firstRow.obj_manufact,
                        value10: firstRow.obj_manufactmodel,                        
                        value11: firstRow.obj_serialno,                        
                        value12: firstRow.value12,
                        value13: firstRow.value13
                        // Add more fields as needed
                    };
                    transformedData.push(rowData);
                //});
            }
                objectPanel.getStore().loadData(transformedData);
                
            

                          var mywindow = Ext.create('Ext.window.Window', {
                title: '<i class="fa fa-eye" style="margin-right:8px;"></i><b style="color: white;">PM Preview</b>',
                cls: 'iux-product-window',
                width: 920,
                modal: true,
                padding: '12 12 12 12',
                height: 920,
                layout: {
                    type: 'vbox',
                    align: 'stretch'
                },
                closable: true,
                resizable: true,
                style: {
                    'border': '1px solid #cbd5e1',
                  'border-radius':'14px'
                  },
                items: [{
                    items: [PMHeader, objectPanel]
                  }
                ],
                header: {
                  style: {
                    'background-color': '#383838',
                    'color': '#ffffff'
                  }
                }
              });


              function CreateActvityTemplate(item) {
                var checklistGrid = {}
        
        var TaskInstrucations = item.ins_details;
        var ActChecklistArray = item.tch;
        var ActDocumentArray = item.doc;                               if (!Ext.isEmpty(ActChecklistArray)) {
                  checklistGrid = Ext.create('Ext.grid.Panel', {
                    title: "<b>Checklist Items</b>",
                    id: "checklistGrid",
                    name: "PreviewActchild",

                    store: Ext.create('Ext.data.Store', {
                      fields: ['Sequence', 'Description', 'Object'],
                      data: ActChecklistArray
                    }),
                    columns: [{
                        text: 'Sequence',
                        dataIndex: 'tch_sequence',
                        width: 100
                      }, {
                        text: 'Description',
                        dataIndex: 'tch_desc',
                        flex: 1,
                      renderer: function(value, metaData, record) {
                        return (record.get('tch_code')?record.get('tch_code'):"") +  (record.get('tch_desc')? record.get('tch_desc'):"");
                      }
                      }, {
                        text: 'Type',
                        dataIndex: 'tch_type',
                        width: 100
                      }
                    ]
                  });
                  checklistGrid.getStore().sort({
                    property: 'tch_sequence',
                    direction: 'ASC'
                  });
                }

                var documentGrid = {};
                if (!Ext.isEmpty(ActDocumentArray)) {
                  documentGrid = Ext.create('Ext.grid.Panel', {
                    title: "<b>Documents</b>",
                    id: "documentGrid",
                    name: "PreviewActchild",
                    store: Ext.create('Ext.data.Store', {
                      fields: ['name', 'fileName', 'description'],
                      data: ActDocumentArray
                    }),
                    columns: [{
                        text: 'Name',
                        dataIndex: 'doc_code',
                        width: 150
                      },{
                        text: 'File Name',
                        dataIndex: 'doc_filename',
                        width: 200
                      }, {
                        text: 'Description',
                        dataIndex: 'doc_desc',
                        flex: 1
                      },{
            xtype: 'actioncolumn',
            text: 'Actions',
            items: [{
                iconCls: 'fa fa-search',
                tooltip: 'View Document',
                handler: function (grid, rowIndex, colIndex) {
                    // Handle edit button click here
                        //e.stopEvent();
                        try{
                            var vFileName = grid.getStore().getAt(rowIndex).getData().doc_filename;
                            var vDocumentCode = grid.getStore().getAt(rowIndex).getData().doc_code;
                            var Tenant = EAM.AppData._appData.storageDataForLogin.tenant;
                            var EAMID = EAM.AppData._appData.storageDataForLogin.eamid;
                            var url = 'VIEWUDOC?filename='+vFileName+'&documentcode='+vDocumentCode+'&tenant='+Tenant+'&eamid='+EAMID;
                            window.open(url, '_blank', 'width=' + document.body.clientWidth + ',height=' + document.body.clientHeight + ',resizable=yes,left=10,top=10,status=yes,scrollbars=yes')
                            }catch(e){
                              console.log(e);
                            }
                
          }
      }]
  }
                    ]
                  });
                }

                var ActivityHeader = Ext.create('Ext.container.Container', {
                  name: "PreviewActchild",
                  padding: '0 0 0 0',
                  margin: '0 0 10 0',
                  html:
                    '<div class="gantt-preview-card" style="margin-bottom:0;">' +
                      '<div class="gantt-preview-fields" style="margin-top:0;">' +
                        '<div class="gantt-preview-field"><span>Activity</span><strong>' + safeHtml(item.ppa_act) + '</strong></div>' +
                        '<div class="gantt-preview-field"><span>Task</span><strong>' + safeHtml(item.ppa_task || 'NA') + '</strong></div>' +
                        '<div class="gantt-preview-field"><span>Trade</span><strong>' + safeHtml(item.ppa_trade) + '</strong></div>' +
                        '<div class="gantt-preview-field"><span>Estimated Hours</span><strong>' + safeHtml(item.ppa_est) + '</strong></div>' +
                        '<div class="gantt-preview-field"><span>Persons</span><strong>' + safeHtml(item.ppa_persons) + '</strong></div>' +
                        '<div class="gantt-preview-field"><span>Notes</span><strong>' + safeHtml(item.ppa_note) + '</strong></div>' +
                      '</div>' +
                    '</div>'
                });

                var instructionGrid = {};
                if (!Ext.isEmpty(TaskInstrucations)) {
                  var vInstructions = "";

                  if (!Ext.isEmpty(TaskInstrucations))
                    vInstructions = TaskInstrucations.replaceAll('\n', '<br>');
          else 
          vInstructions = "Not Available";

                  instructionGrid = Ext.create('Ext.panel.Panel', {
                    name: "PreviewActchild",
                    title: "<b>Checklist Instructions</b>",

                    //collapsed: true,
                    collapsible: true,
                    bodyPadding: 10,
                    html: '<div class="gantt-preview-instructions">' + vInstructions + '</div>'
                  });
                }

                var vCollapsed = true;
                if (item.activity == 10) {
                  vCollapsed = false;
                } else {
                  vCollapsed = true;
                }

                var myPanel1 = Ext.create('Ext.panel.Panel', {

                  scrollable: 'y',
                  margin: '0 0 10 0',
                  collapsible: true,
                  title: '<i class="fa fa-tasks" style="margin-right:6px;color:#0066cc;"></i>Activity <b>' +  safeHtml(item.ppa_act) + '</b> &nbsp; Task: ' + safeHtml(item.ppa_task ? item.ppa_task : "NA"),
                  collapsed: vCollapsed,
                  border: true,
                  bodyPadding: 12,
                  header: true,
                  //bodyPadding: '10 0 0 10',
                  id: "currentPanel" + item.ppa_act,
                  name: "activityPanel",
                  align: 'center',
                  autoDestroy: true,
                  items: [{
                      xtype: 'panel',
                      align: 'center',
                      items: [ActivityHeader, checklistGrid, documentGrid, instructionGrid]
                    }
                  ],
                  header: {
                    style: {
                      'background-color': '#ebebeb'
                    }
                  }

                });

                return myPanel1;

              }


  var vPMActPreviewData = EAM.Ajax.request({
                url: "EWSUSR.xmlhttp",
                params: {
                    GRID_NAME: "AUPREA",
                    USER_FUNCTION_NAME: "AUPREA",
                    SYSTEM_FUNCTION_NAME: "EWSUSR",
                    CURRENT_TAB_NAME: "LST",
                    COMPONENT_INFO_TYPE: "DATA_ONLY", 
          MADDON_FILTER_ALIAS_NAME_1: 'ppm_code',
          MADDON_FILTER_OPERATOR_1: '=',
          MADDON_FILTER_JOINER_1: 'AND',
          MADDON_FILTER_SEQNUM_1: '1',
          MADDON_FILTER_VALUE_1: vPMPreviewData[0].evt_ppm,
          
            }
              }).responseData.pageData.grid.GRIDRESULT.GRID.DATA;
        
      var groupedData = {};

        vPMActPreviewData.forEach(item => {
          const ppa_act = item.ppa_act;

          // Initialize the ppa_act group if it doesn't exist
          if (!groupedData[ppa_act]) {
            groupedData[ppa_act] = {
              ppa_act: ppa_act,
              ppa_est: item.ppa_est,
              ppa_note: item.ppa_note,
              ppa_persons: item.ppa_persons,
              ppa_task: item.ppa_task,
              ppa_trade: item.ppa_trade,
              doc: [], // Initialize an array to hold doc objects
              tch: [],  // Initialize an array to hold tch objects
              ins: {}  // Initialize an array to hold tch objects
            };
          }
          
          groupedData[ppa_act].ins_details = item.ins_details; 
          // Add the current tch object to the tch array
          groupedData[ppa_act].tch.push({
            tch_code: item.tch_code,
            tch_desc: item.tch_desc,
            tch_sequence: item.tch_sequence,
            tch_type: item.tch_type
          });

          // Add the current doc object to the doc array
          groupedData[ppa_act].doc.push({
            doc_code: item.doc_code,
            doc_filename: item.doc_filename,
            doc_desc: item.doc_desc,
          });
        });
              var myPanel = {};

              var AccordionPanel = Ext.create('Ext.panel.Panel', {
                autoScroll: true,
                flex: 1,
                scrollable: "y",
                bodyPadding: 10,
                margin: '10 0 0 0',
                style: {
                  'background-color': '#ffffff'
                },
                tbar: [{
                    xtype: 'tbtext',
                    text: '<b><i class="fa fa-list-ul" style="margin-right:6px;color:#0066cc;"></i>Activity Details</b>',
                    style: {
                      'background-color': '#eef6ff',
                      'border': '1px solid #bfdbfe',
                      'border-radius': '6px',
                      'padding':'8px 12px',
                      'font-weight': 'bold'
                    }
                  }, {
                    xtype: 'tbfill'
                  }, {
                    xtype: 'button',
                    text: '<i class="fa fa-compress" style="margin-right:5px;"></i>Collapse All',
                    style: {
                      'background-color': '#f0f0f0',
                      'border-radius': '6px',
                      'margin': '0 5 0 0'
                    },
                    handler: function () {
                      var panels = Ext.ComponentQuery.query('[name=activityPanel]');

                      Ext.Array.each(panels, function (panel) {
                        panel.collapse();
                      });

                    }
                  }, {
                    xtype: 'button',
                    text: '<i class="fa fa-expand" style="margin-right:5px;"></i>Expand All',
                    style: {
                      'background-color': '#f0f0f0',
                      'border-radius': '6px'
                    },
                    handler: function () {
                      var panels = Ext.ComponentQuery.query('[name=activityPanel]');

                      Ext.Array.each(panels, function (panel) {
                        panel.expand();
                      });

                    }
                  }
                ],
                defaults: {
                  bodyStyle: 'padding:10px'
                },
                layout: {
                  // layout-specific configs go here
                  type: 'vbox',
                  align: 'stretch'
                }
              });

              Object.values(groupedData).forEach(item => {
              console.log(item);
              myPanel = CreateActvityTemplate(item);
              AccordionPanel.add(myPanel);
              mywindow.add(AccordionPanel);
      });

              mywindow.show();

            } // End of Preview

          }
        }
      });

      var x = event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft,
      y = event.clientY + document.body.scrollTop + document.documentElement.scrollTop;
      menu.showAt(x, y);

    });

    gantt.attachEvent("onTaskClick", function(id, e) {
      var target = e && e.target ? e.target : null;
      if (target && target.className && String(target.className).indexOf('iux-bulk-select') !== -1) {
        toggleBulkTaskSelection(id, target.checked);
        return false;
      }
      return true;
    });

    gantt.attachEvent("onGanttRender", function() {
      syncBulkSelectAllState();
    });

    var ganttNode = document.getElementById("gantt_here");
    if (ganttNode && !ganttNode._iuxBulkSelectBound) {
      ganttNode._iuxBulkSelectBound = true;
      ganttNode.addEventListener('change', function(e) {
        var target = e.target;
        if (!target) return;
        if (target.id === 'iuxBulkSelectAll') {
          setAllVisibleBulkSelections(target.checked);
        } else if (target.className && String(target.className).indexOf('iux-bulk-select') !== -1) {
          var taskId = target.getAttribute('data-task-id');
          if (taskId) toggleBulkTaskSelection(taskId, target.checked);
        }
      });
    }

    if (ganttNode && !ganttNode._iuxTimelineDateClickBound) {
      ganttNode._iuxTimelineDateClickBound = true;
      ganttNode.addEventListener('click', function(e) {
        var target = e.target;
        while (target && target !== ganttNode && !target.getAttribute('data-iux-scale-date')) {
          target = target.parentElement;
        }
        if (!target || target === ganttNode) return;
        e.preventDefault();
        e.stopPropagation();
        showScheduledWorkOrdersForDatePopup(target.getAttribute('data-iux-scale-date'));
      });
    }

    gantt.attachEvent("onTaskDblClick", function (id, e) {
      var task = gantt.getTask(id);
      if (isFeatureEnabled('shiftPopup')) {
        showShiftAssignmentPopup(id);
        return false;
      }

      var existingPopup = Ext.ComponentQuery.query('#mypopup');
      if (existingPopup.length > 0 && existingPopup[0].isVisible()) {
        existingPopup[0].close();
      }

      var data = [{
          name: '<i class="fa fa-file-text" style="color:#0066cc;margin-right:6px;"></i>Work Order',
          value: task.EVT_CODE || 'N/A'
        }, {
          name: '<i class="fa fa-align-left" style="color:#0066cc;margin-right:6px;"></i>Description',
          value: task.EVT_DESC || 'N/A'
        }, {
          name: '<i class="fa fa-briefcase" style="color:#28a745;margin-right:6px;"></i>Project',
          value: task.EVT_PROJECT || 'N/A'
        }, {
          name: '<i class="fa fa-info-circle" style="color:#ff6600;margin-right:6px;"></i>Status',
          value: (task.EVT_STATUS_DESC || task.EVT_STATUS) || 'N/A'
        }, {
          name: '<i class="fa fa-cog" style="color:#9933cc;margin-right:6px;"></i>Equipment',
          value: task.EVT_OBJECT || 'N/A'
        }, {
          name: '<i class="fa fa-list-alt" style="color:#9933cc;margin-right:6px;"></i>Object Desc',
          value: task.OBJ_DESC || 'N/A'
        }, {
          name: '<i class="fa fa-map-marker" style="color:#dc3545;margin-right:6px;"></i>Location',
          value: task.OBJ_LOCATION || 'N/A'
        }, {
          name: '<i class="fa fa-calendar-check-o" style="color:#dc3545;margin-right:6px;"></i>Due Date',
          value: task.EVT_DUE || 'N/A'
        }, {
          name: '<i class="fa fa-hourglass-half" style="color:#ffc107;margin-right:6px;"></i>Estimated Hours',
          value: task.ACT_EST || 'N/A'
        }, {
          name: '<i class="fa fa-wrench" style="color:#17a2b8;margin-right:6px;"></i>PM Schedule',
          value: task.EVT_PPM || 'N/A'
        }, {
          name: '<i class="fa fa-tag" style="color:#17a2b8;margin-right:6px;"></i>Type',
          value: task.EVT_JOBTYPE || 'N/A'
        }
      ];

      var store = Ext.create('Ext.data.Store', {
        fields: ['name', 'value'],
        data: data
      });

      var grid = Ext.create('Ext.grid.Panel', {
        cls: 'iux-workorder-details-grid',
        viewConfig: {
          enableTextSelection: true,
          stripeRows: true,
          cls: 'iux-workorder-details-view'
        },
        store: store,
        border: false,
        columns: [{
            text: '<i class="fa fa-list" style="margin-right:5px;"></i>Field',
            dataIndex: 'name',
            align: 'left',
            width: 200,
            tdCls: 'gantt-popup-cell'
          }, {
            text: '<i class="fa fa-database" style="margin-right:5px;"></i>Value',
            dataIndex: 'value',
            align: 'left',
            flex: 1,
            tdCls: 'gantt-popup-cell'
          }
        ],
        selModel: {
          selType: 'cellmodel'
        }
      });

      var win = Ext.create('Ext.window.Window', {
        title: '<i class="fa fa-file-alt" style="margin-right:8px;"></i><b>Work Order Details</b>',
        cls: 'iux-product-window iux-workorder-details-window',
        items: [grid],
        layout: 'fit',
        width: 650,
        height: 480,
        id: 'mypopup',
        modal: true,
        constrain: true,
        resizable: true,
        bodyPadding: 10,
        header: {
          style: {
            'background-color': '#383838',
            'color': '#ffffff'
          }
        },
        style: {
          'border-radius': '8px',
          'box-shadow': '0 4px 15px rgba(0,0,0,0.2)'
        },
        buttons: [/*{
            text: '<i class="fa fa-copy" style="margin-right:5px;"></i>Copy Details',
            scale: 'medium',
            cls: 'x-btn-default-medium',
            style: {
              'background-color': '#ffffff',
              'border': '1px solid #ced4da',
              'color': '#333333',
              'border-radius': '4px'
            },
            handler: function() {
              var details = 'Work Order: ' + (task.EVT_CODE || 'N/A') + '\n' +
                          'Description: ' + (task.EVT_DESC || 'N/A') + '\n' +
                          'Status: ' + ((task.EVT_STATUS_DESC || task.EVT_STATUS) || 'N/A') + '\n' +
                          'Equipment: ' + (task.EVT_OBJECT || 'N/A') + '\n' +
                          'Location: ' + (task.OBJ_LOCATION || 'N/A');
              if (navigator.clipboard) {
                navigator.clipboard.writeText(details).then(function() {
                  EAM.Messaging.showConfirmation('Details copied to clipboard!');
                });
              }
            }
          }, */{
            text: '<i class="fa fa-times" style="margin-right:5px;"></i>Close',
            scale: 'medium',
            cls: 'x-btn-default-medium',
            style: {
              'background-color': '#ffffff',
              'border': '1px solid #ced4da',
              'color': '#333333',
              'border-radius': '4px'
            },
            handler: function() {
              win.close();
            }
          }
        ],
        buttonAlign: 'center'
      });
      
      win.show();
      win.center();
    });

    applyDayScaleConfigurationToZoomConfig();
    gantt.ext.zoom.init(zoomConfig);
    gantt.ext.zoom.setLevel(getZoomLevelName("day"));
    gantt.ext.zoom.attachEvent("onAfterZoom", function (level, config) {
      var levels = ['Day', 'Week', 'Month', 'Quarter', 'Year'];
      var lbl = Ext.getCmp('viewscale_label');
      if (lbl) {
        lbl.setText(levels[level] || config.name);
      }
    })

    /*
    gantt.parse({
    data: [{ id: 1, text: "Project #2", start_date: "01-04-2023", duration: 18, progress: 0.4, open: true },{ id: 2, text: "Task #1", start_date: "02-04-2023", duration: 8, progress: 0.6, parent: 1 },{ id: 3, text: "Task #2", start_date: "11-04-2023", duration: 8, progress: 0.6, parent: 1 }
    ]
    });
    */

  }

  function UDSEntry_IUSESS(vParameters) {
    return GanttDataAccess.insertSessionRecord(vParameters);
  }

  function generateGuid() {
    var timestamp = new Date().getTime();
    var guid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (timestamp + Math.random() * 16) % 16 | 0;
      timestamp = Math.floor(timestamp / 16);
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return guid.toUpperCase();
  }

  function formatDate(vDate) {
    var vMonth = vDate.getMonth() + 1;
    var vDay = vDate.getDate();
    var vYear = vDate.getFullYear();
    return ("0" + vMonth.toString()).slice(-2) + '/' + ("0" + vDay.toString()).slice(-2) + '/' + vDate.getFullYear();
  }

  function formatDate2(vDate) {
    var inclusiveDate = new Date(vDate);
    inclusiveDate.setDate(inclusiveDate.getDate() - 1);
    return formatDate(inclusiveDate);
  }

  function formatDateDMY(vDate) {
    var vDay   = vDate.getDate();
    var vMonth = vDate.getMonth() + 1;
    var vYear  = vDate.getFullYear();
    return ("0" + vDay.toString()).slice(-2) + '-' + ("0" + vMonth.toString()).slice(-2) + '-' + vYear;
  }

  function getCalendarDayDiff(fromDate, toDate) {
    var from = new Date(fromDate);
    var to = new Date(toDate);
    if (isNaN(from.getTime()) || isNaN(to.getTime())) return 0;
    var fromUtc = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
    var toUtc = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
    return Math.round((toUtc - fromUtc) / (1000 * 60 * 60 * 24));
  }

  function getInclusiveCalendarDayCount(startDate, endDate) {
    return Math.max(1, getCalendarDayDiff(startDate, endDate) + 1);
  }

  function formatDateForGantt(vDate) {
    return vDate.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '-');
  }

  function getActiveConfigurationJson() {
    return normalizeGanttConfigurationJson(cloneJsonObject(gGanttGlobal.ConfigurationJson || createEmptyGanttConfigurationJson()));
  }

  function getCurrentUserName() {
    try {
      return String(EAM.AppData.getInstallParams().get("user") || "");
    } catch (e) {
      return "";
    }
  }

  // ==========================================================================
  // 08. Configuration
  // ==========================================================================
  function canEditUserConfiguration() {
    var policy = gGanttGlobal.adminConfiguration || {};
    var scope = String(policy.configurationScope || "USER").toUpperCase();
    if (scope !== "CUSTOMER") return true;

    var currentUser = getCurrentUserName().toUpperCase();
    var admins = policy.administratorUsers || [];
    for (var i = 0; i < admins.length; i++) {
      if (String(admins[i]).toUpperCase() === currentUser) return true;
    }
    return false;
  }

  function getConfigurationScopeLabel() {
    var scope = String((gGanttGlobal.adminConfiguration && gGanttGlobal.adminConfiguration.configurationScope) || "USER").toUpperCase();
    return scope === "CUSTOMER" ? "Customer Configuration" : "User Configuration";
  }

  function getConfigurationColumnOptions(config) {
    var byCode = {};
    function collect(items, mode) {
      (items || []).forEach(function(item) {
        if (!item || Ext.isEmpty(item.code)) return;
        if (!byCode[item.code]) byCode[item.code] = cloneJsonObject(item);
        byCode[item.code].mode = mode;
      });
    }
    collect(config.columns && config.columns.SELECT, "SELECT");
    collect(config.columns && config.columns.DSELECT, "DSELECT");
    return Object.keys(byCode).sort(function(a, b) {
      var aProp = parseInt(byCode[a].property, 10);
      var bProp = parseInt(byCode[b].property, 10);
      if (!isNaN(aProp) && !isNaN(bProp)) return aProp - bProp;
      return a.localeCompare(b);
    }).map(function(code) { return byCode[code]; });
  }

  function stripColumnLabelHtml(label) {
    var text = String(label || "");
    text = text.replace(/<div[^>]*data-(text|date)-filter[^>]*>[\s\S]*?<\/div>/gi, "");
    text = text.replace(/<[^>]+>/g, " ");
    text = text.replace(/\s+/g, " ").trim();
    return text;
  }

  function getReadableColumnLabel(code) {
    var text = String(code || "");
    text = text.replace(/^EVT_/, "");
    text = text.replace(/^OBJ_/, "Equipment ");
    text = text.replace(/^ACT_/, "");
    text = text.replace(/^PER_/, "");
    text = text.replace(/_/g, " ").toLowerCase();
    return text.replace(/\b\w/g, function(ch) { return ch.toUpperCase(); });
  }

  function isPotentialWorkOrderColumn(code) {
    var value = String(code || "");
    if (!/^[A-Z][A-Z0-9_]*$/.test(value)) return false;
    return [
      "IUX_BULK_SELECT", "ID", "TEXT", "COLOR", "TEXTCOLOR", "DURATION", "OPEN",
      "PARENT", "PROGRESS", "MODIFIED", "START_DATE", "END_DATE"
    ].indexOf(value) === -1;
  }

  function isLikelyDateColumn(code, option) {
    return isFixedDSelectColumn(code);
  }

  function isFixedDSelectColumn(code) {
    return [
      "EVT_DUE",
      "EVT_SCHEDEND",
      "EVT_TARGET",
      "EVT_UDFDATE01",
      "EVT_UDFDATE02"
    ].indexOf(String(code || "").toUpperCase()) !== -1;
  }

  function getNextColumnProperty(root) {
    var maxProperty = 0;
    Ext.Array.each(root.querySelectorAll('[data-config-column-property]'), function(row) {
      var property = parseInt(row.getAttribute('data-config-column-property'), 10);
      if (!isNaN(property) && property > maxProperty) maxProperty = property;
    });
    return String(maxProperty + 10);
  }

  function addAvailableColumnOption(byCode, code, label, property, viewType, dataType) {
    if (Ext.isEmpty(code)) return;
    var key = String(code).toUpperCase();
    if (!isPotentialWorkOrderColumn(key)) return;
    if (!byCode[key]) {
      byCode[key] = {
        code: key,
        value: stripColumnLabelHtml(label) || getReadableColumnLabel(key),
        property: property || "",
        viewType: viewType || "",
        dataType: dataType || ""
      };
    } else {
      byCode[key].value = byCode[key].value || stripColumnLabelHtml(label) || getReadableColumnLabel(key);
      byCode[key].property = byCode[key].property || property || "";
      byCode[key].viewType = byCode[key].viewType || viewType || "";
      byCode[key].dataType = byCode[key].dataType || dataType || "";
    }
  }

  function getAvailableLayoutColumnOptions(config) {
    var byCode = {};
    var defaultConfig = {};
    try {
      defaultConfig = GanttDataAccess.loadDefaultConfigurationJson();
    } catch (e) {
      defaultConfig = {};
    }

    function collectConfigColumns(sourceConfig) {
      var columns = getConfigurationColumnOptions(sourceConfig || {});
      columns.forEach(function(col) {
        addAvailableColumnOption(byCode, col.code, col.value, col.property, col.viewType, col.mode === "DSELECT" ? "date" : "");
      });
    }

    collectConfigColumns(defaultConfig);
    collectConfigColumns(config);

    (gGanttGlobal.ListColumnsStore || []).forEach(function(column) {
      if (!column || Ext.isEmpty(column.name)) return;
      addAvailableColumnOption(byCode, column.name, column.label, "", "", column.dataType || "");
    });

    function collectDataKeys(row) {
      if (!row) return;
      Object.keys(row).forEach(function(key) {
        addAvailableColumnOption(byCode, key, getReadableColumnLabel(key), "", "", isLikelyDateColumn(key) ? "date" : "");
      });
    }

    (gGanttGlobal.WorkOrderData || []).slice(0, 20).forEach(collectDataKeys);
    if (typeof gantt !== 'undefined' && gantt.eachTask) {
      var taskCount = 0;
      gantt.eachTask(function(task) {
        if (taskCount >= 20) return;
        taskCount++;
        collectDataKeys(task);
      });
    }

    return Object.keys(byCode).sort(function(a, b) {
      return String(byCode[a].value || a).localeCompare(String(byCode[b].value || b));
    }).map(function(code) { return byCode[code]; });
  }

  function buildLayoutColumnOptionHtml(options) {
    var html = '<option value="">Select column to add...</option>';
    (options || []).forEach(function(option) {
      html += '<option value="' + safeHtml(option.code) + '">' +
        safeHtml((option.value || option.code) + ' (' + option.code + ')') +
      '</option>';
    });
    return html;
  }

  function renderUserConfigurationColumnRow(col, index, readOnly) {
    var disabled = readOnly ? " disabled" : "";
    return '<tr data-config-column-code="' + safeHtml(col.code) + '" data-config-column-label="' + safeHtml(col.value || col.code) + '" data-config-column-property="' + safeHtml(col.property || "") + '" data-config-column-viewtype="' + safeHtml(col.viewType || "") + '">' +
      '<td><strong>' + safeHtml(col.value || col.code) + '</strong><div style="font-size:11px;color:#6b7280;">' + safeHtml(col.code) + '</div></td>' +
      '<td style="text-align:center;">' + (readOnly ? '' : '<button type="button" class="gantt-user-column-remove"><i class="fa fa-trash"></i></button>') + '</td>' +
    '</tr>';
  }

  function getStoreOptions(store) {
    var values = [];
    if (!store || !store.each) return values;
    store.each(function(record) {
      var code = record.get('code');
      if (Ext.isEmpty(code) || code === "ALL") return;
      values.push({ code: code, description: record.get('description') || code });
    });
    return values;
  }

  function addOption(options, code, description) {
    if (Ext.isEmpty(code)) return;
    var key = String(code);
    for (var i = 0; i < options.length; i++) {
      if (String(options[i].code) === key) return;
    }
    options.push({ code: key, description: description || key });
  }

  function getLookupOptions(config, lookupName, store, colorPart) {
    var options = getStoreOptions(store);
    var lookupRows = (config.lookups && config.lookups[lookupName]) || [];
    (lookupRows || []).forEach(function(item) {
      addOption(options, item.code, item.value || item.description || item.code);
    });
    (config.colors || []).forEach(function(color) {
      var parts = getColorParts(color.code);
      addOption(options, colorPart === "type" ? parts.type : parts.status);
    });
    if (typeof gantt !== 'undefined' && gantt.eachTask) {
      gantt.eachTask(function(task) {
        if (colorPart === "type") addOption(options, task.EVT_JOBTYPE, task.EVT_JOBTYPE_DESC || task.EVT_JOBTYPE);
        if (colorPart === "status") addOption(options, task.EVT_STATUS, task.EVT_STATUS_DESC || task.EVT_STATUS);
      });
    }
    return options.sort(function(a, b) { return String(a.code).localeCompare(String(b.code)); });
  }

  function buildOptionHtml(options, selected) {
    var html = "";
    (options || []).forEach(function(option) {
      var isSelected = String(option.code) === String(selected) ? " selected" : "";
      html += '<option value="' + safeHtml(option.code) + '"' + isSelected + '>' + safeHtml(option.code + ' - ' + option.description) + '</option>';
    });
    return html;
  }

  function getColorParts(code) {
    var parts = String(code || "").split("#");
    return { type: parts[0] || "", status: parts[1] || "" };
  }

  function renderColorConfigRows(colors, typeOptions, statusOptions, readOnly) {
    var rows = "";
    var disabled = readOnly ? " disabled" : "";
    (colors || []).forEach(function(color) {
      var parts = getColorParts(color.code);
      addOption(typeOptions, parts.type);
      addOption(statusOptions, parts.status);
      rows +=
        '<tr class="gantt-user-color-row">' +
          '<td><select class="gantt-user-color-type"' + disabled + '>' + buildOptionHtml(typeOptions, parts.type) + '</select></td>' +
          '<td><select class="gantt-user-color-status"' + disabled + '>' + buildOptionHtml(statusOptions, parts.status) + '</select></td>' +
          '<td><input class="gantt-user-color-value" type="color" value="' + safeHtml(color.value || '#0d6efd') + '"' + disabled + '></td>' +
          '<td>' + (readOnly ? '' : '<button type="button" class="gantt-user-color-remove"><i class="fa fa-trash"></i></button>') + '</td>' +
        '</tr>';
    });
    return rows;
  }

  function renderDayScaleConfigSection(dayScale, readOnly) {
    var disabled = readOnly ? " disabled" : "";
    dayScale = dayScale || getDefaultDayScaleConfiguration();
    return '<div class="gantt-user-config-section">' +
      '<div class="gantt-user-config-title"><i class="fa fa-calendar"></i> Day Scale</div>' +
      '<div class="gantt-user-config-note">Only Day scale is configurable. Week, Month, Quarter, and Year remain hard coded.</div>' +
      getDayScaleConfigHtml(dayScale, 'gantt-day-scale', readOnly) +
    '</div>';
  }

  function getDayScaleDateFormatOptions() {
    return [
      { code: "%d %M", label: "Day + short month", preview: "24 May" },
      { code: "%j %D", label: "Day + weekday", preview: "24 Sun" },
      { code: "%d %F", label: "Day + full month", preview: "24 May" },
      { code: "%D %d %M", label: "Weekday + date", preview: "Sun 24 May" },
      { code: "%l %d %F", label: "Full weekday + date", preview: "Sunday 24 May" },
      { code: "%m/%d", label: "MM/DD", preview: "05/24" },
      { code: "%d/%m", label: "DD/MM", preview: "24/05" },
      { code: "%Y-%m-%d", label: "ISO date", preview: "2026-05-24" },
      { code: "%d-%m-%Y", label: "DD-MM-YYYY", preview: "24-05-2026" },
      { code: "%m-%d-%Y", label: "MM-DD-YYYY", preview: "05-24-2026" },
      { code: "%d %M %Y", label: "Day month year", preview: "24 May 2026" },
      { code: "%W", label: "Week number", preview: "21" }
    ];
  }

  function buildDayScaleDateFormatOptionsHtml(options, selectedFormat) {
    var html = "";
    var selectedFound = false;
    (options || []).forEach(function(option) {
      var isSelected = option.code === selectedFormat;
      if (isSelected) selectedFound = true;
      html += '<option value="' + safeHtml(option.code) + '"' + (isSelected ? ' selected' : '') + '>' +
        safeHtml(option.label + ' - ' + option.preview + ' (' + option.code + ')') +
      '</option>';
    });
    if (!selectedFound && !Ext.isEmpty(selectedFormat)) {
      html += '<option value="' + safeHtml(selectedFormat) + '" selected>' + safeHtml('Current custom - ' + selectedFormat) + '</option>';
    }
    return html;
  }

  function getDayScaleConfigHtml(dayScale, idPrefix, readOnly) {
    var disabled = readOnly ? " disabled" : "";
    var formatOptions = getDayScaleDateFormatOptions();
    dayScale = dayScale || getDefaultDayScaleConfiguration();
    return '<div class="gantt-user-config-grid">' +
      '<label>Date Label Format<select id="' + idPrefix + '-format"' + disabled + '>' + buildDayScaleDateFormatOptionsHtml(formatOptions, dayScale.dateFormat || "%d %M") + '</select></label>' +
      '<label>Minimum Column Width<input id="' + idPrefix + '-width" type="number" min="40" max="240" value="' + safeHtml(dayScale.minColumnWidth || 80) + '"' + disabled + '></label>' +
      '<label class="gantt-user-config-check"><input id="' + idPrefix + '-hours" type="checkbox" ' + (dayScale.showEstimatedHours !== false ? 'checked' : '') + disabled + '> Show estimated hours</label>' +
    '</div>';
  }

  function collectDayScaleConfigFromRoot(root, idPrefix, fallback) {
    var dayScale = cloneJsonObject(fallback || getDefaultDayScaleConfiguration());
    var formatEl = root.querySelector('#' + idPrefix + '-format');
    var widthEl = root.querySelector('#' + idPrefix + '-width');
    var hoursEl = root.querySelector('#' + idPrefix + '-hours');
    dayScale.dateFormat = formatEl && !Ext.isEmpty(formatEl.value) ? formatEl.value : "%d %M";
    dayScale.minColumnWidth = widthEl ? parseInt(widthEl.value, 10) : 80;
    dayScale.scaleHeight = getDefaultDayScaleConfiguration().scaleHeight;
    dayScale.showEstimatedHours = hoursEl ? hoursEl.checked : true;
    return dayScale;
  }

  function renderExperienceConfigSection(experience, readOnly) {
    var disabled = readOnly ? " disabled" : "";
    experience = normalizeExperienceConfiguration(experience);
    var highlightOptions = [
      { code: "EVT_UDFDATE01", label: "EVT_UDFDATE01" },
      { code: "EVT_UDFDATE02", label: "EVT_UDFDATE02" },
      { code: "EVT_DUE", label: "EVT_DUE" },
      { code: "EVT_TARGET", label: "EVT_TARGET" },
      { code: "EVT_SCHEDEND", label: "EVT_SCHEDEND" }
    ];
    var optionHtml = "";
    highlightOptions.forEach(function(option) {
      optionHtml += '<option value="' + safeHtml(option.code) + '"' + (option.code === experience.timelineHighlightField ? ' selected' : '') + '>' + safeHtml(option.label) + '</option>';
    });
    var textModeOptions = [
      { code: "DESCRIPTION", label: "Description" },
      { code: "WO", label: "Work Order" },
      { code: "WO_DESCRIPTION", label: "WO + Description" },
      { code: "EQUIPMENT", label: "Equipment" },
      { code: "TRADE", label: "Trade" }
    ];
    var textModeHtml = "";
    textModeOptions.forEach(function(option) {
      textModeHtml += '<option value="' + safeHtml(option.code) + '"' + (option.code === experience.taskTextMode ? ' selected' : '') + '>' + safeHtml(option.label) + '</option>';
    });
    var rowDensityHtml = '<option value="COMFORTABLE"' + (experience.rowDensity === 'COMFORTABLE' ? ' selected' : '') + '>Comfortable</option>' +
      '<option value="COMPACT"' + (experience.rowDensity === 'COMPACT' ? ' selected' : '') + '>Compact</option>';
    return '<div class="gantt-user-config-section">' +
      '<div class="gantt-user-config-title"><i class="fa fa-sliders"></i> Experience</div>' +
      '<div class="gantt-user-config-note">Grid width is capped at 40%. Tooltip delay is capped at 1500 ms. Resource overload threshold is capped at 24 hours.</div>' +
      '<div class="gantt-user-config-grid">' +
        '<label>Default Grid Width %<input id="gantt-exp-grid-width" type="number" min="15" max="40" value="' + safeHtml(experience.gridWidthPercent) + '"' + disabled + '></label>' +
        '<label>Tooltip Delay (ms)<input id="gantt-exp-tooltip-delay" type="number" min="0" max="1500" step="50" value="' + safeHtml(experience.tooltipDelayMs) + '"' + disabled + '></label>' +
        '<label>Timeline Highlight Field<select id="gantt-exp-highlight-field"' + disabled + '>' + optionHtml + '</select></label>' +
        '<label>Resource Overload Threshold<input id="gantt-exp-overload-threshold" type="number" min="1" max="24" step="0.5" value="' + safeHtml(experience.resourceOverloadThresholdHours) + '"' + disabled + '></label>' +
        '<label>Show Task Text Mode<select id="gantt-exp-task-text-mode"' + disabled + '>' + textModeHtml + '</select></label>' +
        '<label>Row Height Mode<select id="gantt-exp-row-density"' + disabled + '>' + rowDensityHtml + '</select></label>' +
        '<label>Task Bar Minimum Width<input id="gantt-exp-task-min-width" type="number" min="0" max="160" value="' + safeHtml(experience.taskBarMinWidth) + '"' + disabled + '></label>' +
        '<label>Readonly Status List<input id="gantt-exp-readonly-statuses" type="text" value="' + configInputValue((experience.readonlyStatuses || []).join(',')) + '"' + disabled + '></label>' +
        '<label class="gantt-user-config-check"><input id="gantt-exp-alt-rows" type="checkbox" ' + (experience.alternateGanttRows ? 'checked' : '') + disabled + '> Alternate Gantt row colors</label>' +
      '</div>' +
    '</div>';
  }

  function collectExperienceConfigFromRoot(root, fallback) {
    var experience = cloneJsonObject(fallback || getDefaultExperienceConfiguration());
    var gridWidthEl = root.querySelector('#gantt-exp-grid-width');
    var tooltipDelayEl = root.querySelector('#gantt-exp-tooltip-delay');
    var highlightFieldEl = root.querySelector('#gantt-exp-highlight-field');
    var altRowsEl = root.querySelector('#gantt-exp-alt-rows');
    var overloadEl = root.querySelector('#gantt-exp-overload-threshold');
    var taskTextModeEl = root.querySelector('#gantt-exp-task-text-mode');
    var rowDensityEl = root.querySelector('#gantt-exp-row-density');
    var taskMinWidthEl = root.querySelector('#gantt-exp-task-min-width');
    var readonlyStatusesEl = root.querySelector('#gantt-exp-readonly-statuses');
    experience.gridWidthPercent = gridWidthEl ? gridWidthEl.value : experience.gridWidthPercent;
    experience.tooltipDelayMs = tooltipDelayEl ? tooltipDelayEl.value : experience.tooltipDelayMs;
    experience.timelineHighlightField = highlightFieldEl && !Ext.isEmpty(highlightFieldEl.value) ? highlightFieldEl.value : experience.timelineHighlightField;
    experience.alternateGanttRows = altRowsEl ? altRowsEl.checked : experience.alternateGanttRows;
    experience.resourceOverloadThresholdHours = overloadEl ? overloadEl.value : experience.resourceOverloadThresholdHours;
    experience.taskTextMode = taskTextModeEl && !Ext.isEmpty(taskTextModeEl.value) ? taskTextModeEl.value : experience.taskTextMode;
    experience.rowDensity = rowDensityEl && !Ext.isEmpty(rowDensityEl.value) ? rowDensityEl.value : experience.rowDensity;
    experience.taskBarMinWidth = taskMinWidthEl ? taskMinWidthEl.value : experience.taskBarMinWidth;
    experience.readonlyStatuses = readonlyStatusesEl ? readonlyStatusesEl.value : experience.readonlyStatuses;
    return normalizeExperienceConfiguration(experience);
  }

  function renderConfiguredDateRows(items, rowClass, readOnly) {
    var disabled = readOnly ? " disabled" : "";
    var rows = "";
    (items || []).forEach(function(item) {
      rows +=
        '<tr class="' + rowClass + '">' +
          '<td><input class="gantt-config-date-code" type="text" value="' + configInputValue(item.code) + '"' + disabled + '></td>' +
          '<td><input class="gantt-config-date-value" type="date" value="' + configInputValue(item.value) + '"' + disabled + '></td>' +
          '<td><input class="gantt-config-date-desc" type="text" value="' + configInputValue(item.description) + '"' + disabled + '></td>' +
          '<td>' + (readOnly ? '' : '<button type="button" class="gantt-config-date-remove"><i class="fa fa-trash"></i></button>') + '</td>' +
        '</tr>';
    });
    return rows;
  }

  function configInputValue(value) {
    return String(value === null || value === undefined ? '' : value).replace(/[&<>"']/g, function(ch) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
    });
  }

  function renderConfiguredDateSection(title, icon, tableId, rowClass, addButtonId, items, readOnly, note) {
    return '<div class="gantt-user-config-section">' +
      '<div class="gantt-user-config-title"><i class="fa ' + icon + '"></i> ' + safeHtml(title) + '</div>' +
      '<div class="gantt-user-config-note">' + safeHtml(note) + '</div>' +
      '<table class="gantt-user-config-table gantt-config-date-table" id="' + tableId + '">' +
        '<thead><tr><th>Code</th><th>Date</th><th>Description</th><th></th></tr></thead>' +
        '<tbody>' + renderConfiguredDateRows(items, rowClass, readOnly) + '</tbody>' +
      '</table>' +
      (readOnly ? '' : '<button type="button" id="' + addButtonId + '" class="gantt-user-config-add"><i class="fa fa-plus"></i> Add Date</button>') +
    '</div>';
  }

  function collectConfiguredDateRows(root, rowSelector, type) {
    var rows = [];
    Ext.Array.each(root.querySelectorAll(rowSelector), function(row, index) {
      var codeEl = row.querySelector('.gantt-config-date-code');
      var valueEl = row.querySelector('.gantt-config-date-value');
      var descEl = row.querySelector('.gantt-config-date-desc');
      var value = valueEl && !Ext.isEmpty(valueEl.value) ? valueEl.value : "";
      if (Ext.isEmpty(value)) return;
      rows.push({
        code: codeEl && !Ext.isEmpty(codeEl.value) ? codeEl.value : type + "_" + (index + 1),
        value: value,
        description: descEl && !Ext.isEmpty(descEl.value) ? descEl.value : value,
        type: type
      });
    });
    return rows;
  }

  function collectUserConfigurationFromPopup(win, baseConfig) {
    var root = win.getEl().dom;
    var config = normalizeGanttConfigurationJson(cloneJsonObject(baseConfig));
    config.adminConfiguration = normalizeAdminConfiguration(gGanttGlobal.ConfigurationJson && gGanttGlobal.ConfigurationJson.adminConfiguration, gGanttGlobal.adminConfiguration);
    var selectedColumns = [];
    var dateColumns = [];

    Ext.Array.each(root.querySelectorAll('[data-config-column-code]'), function(row) {
      var code = row.getAttribute('data-config-column-code');
      var label = row.getAttribute('data-config-column-label');
      var property = row.getAttribute('data-config-column-property');
      var viewType = row.getAttribute('data-config-column-viewtype');
      var item = { code: code, value: label, property: property || "", viewType: viewType || "" };
      if (isFixedDSelectColumn(code)) dateColumns.push(item);
      else selectedColumns.push(item);
    });

    config.columns.SELECT = selectedColumns;
    config.columns.DSELECT = dateColumns;

    var colors = [];
    Ext.Array.each(root.querySelectorAll('.gantt-user-color-row'), function(row) {
      var typeEl = row.querySelector('.gantt-user-color-type');
      var statusEl = row.querySelector('.gantt-user-color-status');
      var colorEl = row.querySelector('.gantt-user-color-value');
      if (!typeEl || !statusEl || !colorEl || Ext.isEmpty(typeEl.value) || Ext.isEmpty(statusEl.value)) return;
      colors.push({ code: typeEl.value + "#" + statusEl.value, value: colorEl.value, type: "COLOR" });
    });
    config.colors = colors;

    var dayScale = config.dayScale || getDefaultDayScaleConfiguration();
    config.dayScale = collectDayScaleConfigFromRoot(root, 'gantt-day-scale', dayScale);
    config.experience = collectExperienceConfigFromRoot(root, config.experience);
    config.usHolidays = collectConfiguredDateRows(root, '.gantt-us-holiday-row', 'US_HOLIDAY');
    config.organizationHolidays = collectConfiguredDateRows(root, '.gantt-org-holiday-row', 'ORG_HOLIDAY');
    config.organizationSpecialDays = collectConfiguredDateRows(root, '.gantt-org-special-day-row', 'ORG_SPECIAL_DAY');

    return config;
  }

  function applySavedUserConfiguration(config) {
    var lookupRows = (gGanttGlobal.InitialConfigStore || []).filter(function(row) {
      return row && !isJsonManagedConfigurationType(row.cfg_type || row.CFG_TYPE);
    });
    gGanttGlobal.ConfigurationJson = cloneJsonObject(config);
    applyFeatureFlags(config);
    applyFeatureVisibilityToRenderedControls();
    gGanttGlobal.InitialConfigStore = mergeInitialConfigurationRows(lookupRows, flattenGanttConfigurationJson(config));
    gGanttGlobal.ColorCombinations = (config.colors || []).map(function(item) {
      return { code: item.code, description: item.value };
    });
    gGanttGlobal._usHolidayCache = {};
    gGanttGlobal._configuredHolidayCache = {};
    gGanttGlobal._timelineCellClassCache = {};
    applyDayScaleConfigurationToZoomConfig();
    if (typeof gantt !== 'undefined' && gantt.ext && gantt.ext.zoom) {
      gantt.ext.zoom.init(zoomConfig);
      gantt.ext.zoom.setLevel(getCurrentZoomLevelName());
      applyExperienceSizingToGantt();
      applyGanttGridWidthToLayout(gantt.config.layout, getGanttGridWidthForBulkMode());
      if (gantt.resetLayout) gantt.resetLayout();
      if (gantt.render) gantt.render();
    }
  }

  function applyFeatureVisibilityToRenderedControls() {
    var bulkSwitch = Ext.getCmp('bulkEditSwitch');
    if (bulkSwitch) {
      if (isFeatureEnabled('bulkEdit')) bulkSwitch.show();
      else bulkSwitch.hide();
    }
    var summaryButton = Ext.getCmp('summaryButton');
    if (summaryButton) {
      if (isFeatureEnabled('summary')) summaryButton.show();
      else summaryButton.hide();
    }
    var summaryIndicator = Ext.getCmp('summaryFilterIndicator');
    if (summaryIndicator && !isFeatureEnabled('summary')) summaryIndicator.hide();
    var exportButton = Ext.getCmp('exportExcelButton');
    if (exportButton) {
      if (isFeatureEnabled('excelDownload')) exportButton.show();
      else exportButton.hide();
    }
    if (!isFeatureEnabled('bulkEdit')) applyBulkEditColumn(true);
    loadResourcesPanelData();
    updateHeader();
  }

  function showUserConfigurationPopup() {
    if (Ext.getCmp('ganttUserConfigWin')) Ext.getCmp('ganttUserConfigWin').destroy();

    var config = getActiveConfigurationJson();
    var readOnly = !canEditUserConfiguration();
    var columns = getConfigurationColumnOptions(config);
    var availableColumnOptions = getAvailableLayoutColumnOptions(config);
    var typeOptions = getLookupOptions(config, "WOTYPE", gGanttGlobal.WorkorderTypeStore, "type");
    var statusOptions = getLookupOptions(config, "WOSTATUS", gGanttGlobal.WorkorderStatusStore, "status");
    var dayScale = config.dayScale || getDefaultDayScaleConfiguration();
    var experience = config.experience || getDefaultExperienceConfiguration();
    var holidayConfig = normalizeGanttConfigurationJson(config);
    var colorRows = renderColorConfigRows(config.colors, typeOptions, statusOptions, readOnly);

    var columnRows = "";
    columns.forEach(function(col, index) {
      columnRows += renderUserConfigurationColumnRow(col, index, readOnly);
    });

    var modeNote = readOnly ?
      '<div class="gantt-user-config-note"><i class="fa fa-lock"></i> This deployment uses one customer configuration. Only ' + safeHtml((gGanttGlobal.adminConfiguration.administratorUsers || []).join(", ")) + ' can change it.</div>' :
      '<div class="gantt-user-config-note"><i class="fa fa-edit"></i> Editing ' + safeHtml(getConfigurationScopeLabel()) + ' as ' + safeHtml(getCurrentUserName()) + '.</div>';

    var html =
      '<div class="gantt-user-config-shell">' +
        modeNote +
        '<div class="gantt-user-config-section">' +
          '<div class="gantt-user-config-title"><i class="fa fa-columns"></i> Columns</div>' +
          '<div class="gantt-user-config-note">Select the columns to show. Date columns are fixed by the system: EVT_DUE, EVT_SCHEDEND, EVT_TARGET, EVT_UDFDATE01, EVT_UDFDATE02.</div>' +
          '<table class="gantt-user-config-table" id="gantt-user-column-table">' +
            '<thead><tr><th>Column</th><th></th></tr></thead>' +
            '<tbody>' + columnRows + '</tbody>' +
          '</table>' +
          (readOnly ? '' : '<div class="gantt-user-column-add-row"><select id="gantt-add-column-select">' + buildLayoutColumnOptionHtml(availableColumnOptions) + '</select><button type="button" id="gantt-add-user-column" class="gantt-user-config-add"><i class="fa fa-plus"></i> Add Column</button></div>') +
        '</div>' +
        '<div class="gantt-user-config-section">' +
          '<div class="gantt-user-config-title"><i class="fa fa-palette"></i> Colors by Type and Status</div>' +
          '<table class="gantt-user-config-table" id="gantt-user-color-table">' +
            '<thead><tr><th>Type</th><th>Status</th><th>Color</th><th></th></tr></thead>' +
            '<tbody>' + colorRows + '</tbody>' +
          '</table>' +
          (readOnly ? '' : '<button type="button" id="gantt-add-user-color" class="gantt-user-config-add"><i class="fa fa-plus"></i> Add Color</button>') +
        '</div>' +
        renderDayScaleConfigSection(dayScale, readOnly) +
        renderExperienceConfigSection(experience, readOnly) +
        renderConfiguredDateSection('US Holidays', 'fa-flag', 'gantt-us-holiday-table', 'gantt-us-holiday-row', 'gantt-add-us-holiday', holidayConfig.usHolidays, readOnly, 'Dates highlighted when Highlight National Holidays is enabled. Admins can replace the dummy dates with customer-approved US holiday dates.') +
        renderConfiguredDateSection('Organization Holidays', 'fa-building', 'gantt-org-holiday-table', 'gantt-org-holiday-row', 'gantt-add-org-holiday', holidayConfig.organizationHolidays, readOnly, 'Organization holiday dates highlighted when Highlight Organization Holidays is enabled.') +
        renderConfiguredDateSection('Organization Special Days', 'fa-star', 'gantt-org-special-table', 'gantt-org-special-day-row', 'gantt-add-org-special-day', holidayConfig.organizationSpecialDays, readOnly, 'Special planning dates such as audit days, safety stand-downs, or customer-specific events.') +
      '</div>';

    var win = Ext.create('Ext.window.Window', {
      id: 'ganttUserConfigWin',
      cls: 'iux-product-window',
      title: '<i class="fa fa-user-cog" style="margin-right:8px;"></i><b style="color:white;">' + getConfigurationScopeLabel() + '</b>',
      width: 760,
      height: 620,
      modal: true,
      scrollable: true,
      bodyPadding: 0,
      header: { style: { 'background-color': '#383838', 'color': '#ffffff' } },
      html: html,
      listeners: {
        afterrender: function(w) {
          var root = w.getEl().dom;
          root.addEventListener('click', function(e) {
            if (readOnly) return;
            var columnRemoveBtn = e.target.closest ? e.target.closest('.gantt-user-column-remove') : null;
            if (columnRemoveBtn) {
              var columnRow = columnRemoveBtn.closest('tr');
              if (columnRow) columnRow.parentNode.removeChild(columnRow);
              return;
            }
            var addColumnBtn = e.target.closest ? e.target.closest('#gantt-add-user-column') : null;
            if (addColumnBtn) {
              var select = root.querySelector('#gantt-add-column-select');
              var columnTableBody = root.querySelector('#gantt-user-column-table tbody');
              if (!select || !columnTableBody || Ext.isEmpty(select.value)) return;
              var columnCode = String(select.value).toUpperCase();
              if (root.querySelector('[data-config-column-code="' + columnCode.replace(/"/g, '\\"') + '"]')) {
                EAM.Messaging.showConfirmation("Column is already part of the Layout Configuration.");
                return;
              }
              var selectedOption = null;
              for (var i = 0; i < availableColumnOptions.length; i++) {
                if (String(availableColumnOptions[i].code).toUpperCase() === columnCode) {
                  selectedOption = availableColumnOptions[i];
                  break;
                }
              }
              if (!selectedOption) {
                selectedOption = { code: columnCode, value: getReadableColumnLabel(columnCode) };
              }
              var newColumn = cloneJsonObject(selectedOption);
              newColumn.property = getNextColumnProperty(root);
              var tempColumnBody = document.createElement('tbody');
              tempColumnBody.innerHTML = renderUserConfigurationColumnRow(newColumn, Date.now(), false);
              columnTableBody.appendChild(tempColumnBody.firstChild);
              select.value = "";
              return;
            }
            var removeBtn = e.target.closest ? e.target.closest('.gantt-user-color-remove') : null;
            if (removeBtn) {
              var row = removeBtn.closest('tr');
              if (row) row.parentNode.removeChild(row);
              return;
            }
            var addBtn = e.target.closest ? e.target.closest('#gantt-add-user-color') : null;
            if (addBtn) {
              var tbody = root.querySelector('#gantt-user-color-table tbody');
              if (tbody) {
                var temp = document.createElement('tbody');
                temp.innerHTML = renderColorConfigRows([{ code: ((typeOptions[0] && typeOptions[0].code) || "") + "#" + ((statusOptions[0] && statusOptions[0].code) || ""), value: "#0d6efd" }], typeOptions, statusOptions, false);
                tbody.appendChild(temp.firstChild);
              }
              return;
            }
            var dateRemoveBtn = e.target.closest ? e.target.closest('.gantt-config-date-remove') : null;
            if (dateRemoveBtn) {
              var dateRow = dateRemoveBtn.closest('tr');
              if (dateRow) dateRow.parentNode.removeChild(dateRow);
              return;
            }
            var dateAddConfig = null;
            if (e.target.closest && e.target.closest('#gantt-add-us-holiday')) {
              dateAddConfig = { tableId: 'gantt-us-holiday-table', rowClass: 'gantt-us-holiday-row', type: 'US_HOLIDAY' };
            } else if (e.target.closest && e.target.closest('#gantt-add-org-holiday')) {
              dateAddConfig = { tableId: 'gantt-org-holiday-table', rowClass: 'gantt-org-holiday-row', type: 'ORG_HOLIDAY' };
            } else if (e.target.closest && e.target.closest('#gantt-add-org-special-day')) {
              dateAddConfig = { tableId: 'gantt-org-special-table', rowClass: 'gantt-org-special-day-row', type: 'ORG_SPECIAL_DAY' };
            }
            if (dateAddConfig) {
              var dateBody = root.querySelector('#' + dateAddConfig.tableId + ' tbody');
              if (dateBody) {
                var tempDateBody = document.createElement('tbody');
                tempDateBody.innerHTML = renderConfiguredDateRows([{ code: dateAddConfig.type + '_' + Date.now(), value: '', description: '' }], dateAddConfig.rowClass, false);
                dateBody.appendChild(tempDateBody.firstChild);
              }
            }
          });
        }
      },
      buttons: readOnly ? [{
        text: '<i class="fa fa-times" style="margin-right:4px;"></i>Close',
        handler: function() { win.close(); }
      }] : [{
        text: '<i class="fa fa-undo" style="margin-right:4px;"></i>Reset to Default Setup',
        handler: function() {
          Ext.Msg.confirm('Reset Layout Configuration', 'Reset Layout Configuration back to the default setup?', function(btn) {
            if (btn !== 'yes') return;
            try {
              var defaultConfig = GanttDataAccess.loadDefaultConfigurationJson();
              applyAdminConfigurationFromDefaultConfig(defaultConfig);
              GanttDataAccess.deleteConfigurationOverride();
              applySavedUserConfiguration(defaultConfig);
              EAM.Messaging.showConfirmation("Layout Configuration reset to default setup.");
              win.close();
              showUserConfigurationPopup();
            } catch (e) {
              console.log(e);
              EAM.Messaging.showConfirmation("Unable to reset Layout Configuration. Please try again.");
            }
          });
        }
      }, {
        text: '<i class="fa fa-save" style="margin-right:4px;"></i>Save ' + getConfigurationScopeLabel(),
        handler: function() {
          try {
            var userConfig = collectUserConfigurationFromPopup(win, config);
            GanttDataAccess.saveConfigurationJson(userConfig, "USER");
            applySavedUserConfiguration(userConfig);
            EAM.Messaging.showConfirmation(getConfigurationScopeLabel() + " saved. Please refresh the Gantt to rebuild columns with the new configuration.");
            win.close();
          } catch (e) {
            console.log(e);
            EAM.Messaging.showConfirmation("Unable to save user configuration. Please review the selected values.");
          }
        }
      }, {
        text: '<i class="fa fa-times" style="margin-right:4px;"></i>Close',
        handler: function() { win.close(); }
      }],
      buttonAlign: 'right'
    });
    win.show();
  }

  function buildSystemLegendHtml(cfgState) {
    var configScope = getConfigurationScopeLabel();
    var canEditConfig = canEditUserConfiguration();
    var adminUsers = (gGanttGlobal.adminConfiguration && gGanttGlobal.adminConfiguration.administratorUsers || []).join(", ");
    var sectionStyle = 'color:#0066cc;border-bottom:2px solid #0066cc;padding-bottom:8px;margin:18px 0 10px 0;';
    var listStyle = 'line-height:1.65;list-style:none;padding-left:0;margin:0;';
    var noteStyle = 'font-size:11px;color:#6b7280;margin-top:3px;line-height:1.45;';
    var swatch = function(style) {
      return '<span style="display:inline-block;width:28px;height:15px;vertical-align:middle;margin-right:8px;border-radius:3px;' + style + '"></span>';
    };
    var row = function(icon, color, title, description, details) {
      return '<li style="margin-bottom:9px;">' +
        '<i class="fa ' + icon + '" style="color:' + color + ';width:22px;"></i>' +
        '<b>' + title + ':</b> ' + description +
        (details ? '<div style="' + noteStyle + '">' + details + '</div>' : '') +
      '</li>';
    };

    return '<div style="font-family:Arial,sans-serif;color:#111827;">' +
      '<div style="background:#f4f6f8;border:1px solid #e5e7eb;border-radius:8px;padding:12px 14px;margin-bottom:14px;">' +
        '<div style="font-size:16px;font-weight:700;color:#111827;">Gantt Planner System Legend</div>' +
        '<div style="font-size:12px;color:#4b5563;margin-top:4px;line-height:1.45;">This legend explains toolbar controls, timeline markings, filters, configuration behavior, and status indicators used across the planning screen.</div>' +
      '</div>' +

      '<h3 style="' + sectionStyle + '">Toolbar Controls</h3>' +
      '<ul style="' + listStyle + '">' +
        row('fa-arrows-alt', '#0066cc', 'Scale', 'Cycles the timeline between Day, Week, Month, Quarter, and Year.', 'Use the left and right arrow buttons to change zoom level.') +
        row('fa-check-square', '#28a745', 'Overdue WOs', 'Controls whether older work orders are included in the query.', 'When off, the session query excludes work orders before the selected From Date/current date. When on, the query allows older work orders based on the SQL lookback rule.') +
        row('fa-calendar', '#ff6600', 'Lookahead', 'Sets the planning horizon for work order retrieval.', 'The selected value is passed to the SESSION record and used by the database script to filter EVT_TARGET into Week, Month, Quarter, Year, or 2 Years.') +
        row('fa-calendar', '#dc3545', 'From Date', 'Sets the visible Gantt start date and the lower bound for non-overdue queries.', 'The database script reads it as CRR_STARTDATE.') +
        row('fa-info-circle', '#ffc107', 'WO Status', 'Filters work orders by EVT_STATUS.', 'The list is loaded from initialization lookup data so values display as Code - Description.') +
        row('fa-tag', '#17a2b8', 'WO Type', 'Filters work orders by EVT_JOBTYPE.', 'The list is loaded from initialization lookup data and is also used by color configuration.') +
        row('fa-building', '#6c757d', 'Department', 'Filters work orders by department/MRC.', 'The selected value is submitted as CRR_MRC and used by the SESSION SQL.') +
        row('fa-database', '#9933cc', 'DataSpy', 'Applies a predefined data source/filter.', 'DataSpy rows come from configuration and lookup initialization. The edit trigger opens DataSpy maintenance.') +
        // Temporarily hidden from the legend; retain for future Global Search use.
        // row('fa-search', '#28a745', 'Global Search', 'Searches visible work order fields in the loaded Gantt data.', 'This is a client-side search over the currently loaded tasks.') +
        row('fa-repeat', '#0066cc', 'Refresh', 'Reloads work orders using current toolbar settings.', 'If unsaved schedule changes exist, the user is warned before refresh discards them.') +
        row('fa-save', '#28a745', 'Save Changes', 'Opens the pending changes review popup before committing schedule changes.', 'The review popup shows old dates, new dates, duration change, status, and per-row revert action.') +
        // Temporarily hidden from the legend; retain for future Summary use.
        // row('fa-chart-pie', '#0d6efd', 'Summary', 'Opens work order summary cards and quick filters.', 'Summary filters can be removed from the toolbar indicator. Show All WOs clears summary and column/search filters.') +
        row('fa-cog', '#495057', 'Configuration', 'Opens display highlighters and configuration controls.', 'This includes timeline highlights, due-date flags, shutdown highlighting, and ' + configScope + ' management.') +
      '</ul>' +

      '<h3 style="' + sectionStyle + '">Timeline Highlights</h3>' +
      '<ul style="' + listStyle + '">' +
        '<li style="margin-bottom:9px;">' + swatch('background:rgba(220,53,69,0.09);border:1px solid #f8d7da;') + '<b>Weekend Columns:</b> Saturday and Sunday columns are shaded when enabled.' + cfgState(gGanttGlobal.ganttConfig.highlightWeekends, gGanttGlobal.ganttConfig.highlightWeekends ? 'On' : 'Off') + '<div style="' + noteStyle + '">Useful for quickly seeing non-working calendar periods across the entire timeline.</div></li>' +
        '<li style="margin-bottom:9px;">' + swatch('background:rgba(220,53,69,0.18);border:1px solid #dc3545;') + '<b>Customer Specific Date Cells:</b> Customer specific date cells are highlighted for each work order when enabled.' + cfgState(gGanttGlobal.ganttConfig.highlightDueDates, gGanttGlobal.ganttConfig.highlightDueDates ? 'On' : 'Off') + '<div style="' + noteStyle + '">The customer specific date comes from ' + safeHtml(getConfiguredExperience().timelineHighlightField) + '.</div></li>' +
        '<li style="margin-bottom:9px;"><span style="display:inline-block;width:28px;color:#dc3545;text-align:center;margin-right:8px;"><i class="fa fa-flag"></i></span><b>Due Date Flag:</b> Adds a small red flag on task bars for work orders with a due date.' + cfgState(gGanttGlobal.ganttConfig.highlightDueDateFlags, gGanttGlobal.ganttConfig.highlightDueDateFlags ? 'On' : 'Off') + '<div style="' + noteStyle + '">The flag tooltip shows the work order due date without changing the task duration.</div></li>' +
        '<li style="margin-bottom:9px;">' + swatch('background:rgba(111,66,193,0.16);border:1px solid #d6c7ef;') + '<b>Shutdown Dates:</b> Shutdown columns are shaded when a work order has PRJ_SHUTDOWN populated.' + cfgState(gGanttGlobal.ganttConfig.highlightShutdownDates, gGanttGlobal.ganttConfig.highlightShutdownDates ? 'On' : 'Off') + '<div style="' + noteStyle + '">The highlighted range spans from EVT_TARGET through EVT_SCHEDEND. Multi-day shutdown work orders highlight every date in the range.</div></li>' +
        '<li style="margin-bottom:9px;">' + swatch('background:rgba(255,193,7,0.18);border:1px solid #ffe082;') + '<b>National Holidays:</b> US federal holidays are shaded when enabled.' + cfgState(gGanttGlobal.ganttConfig.highlightNationalHolidays, gGanttGlobal.ganttConfig.highlightNationalHolidays ? 'On' : 'Off') + '<div style="' + noteStyle + '">The holiday cache is rebuilt when the option is toggled.</div></li>' +
        '<li style="margin-bottom:9px;">' + swatch('background:rgba(13,110,253,0.12);border:1px solid #93c5fd;') + '<b>Organization Holidays:</b> Configured organization holiday dates are shaded when enabled.' + cfgState(gGanttGlobal.ganttConfig.highlightOrgHolidays, gGanttGlobal.ganttConfig.highlightOrgHolidays ? 'On' : 'Off') + '<div style="' + noteStyle + '">Admins maintain Organization Holidays and Organization Special Days in Layout Configuration.</div></li>' +
      '</ul>' +

      '<h3 style="' + sectionStyle + '">Task Colors</h3>' +
      '<ul style="' + listStyle + '">' +
        row('fa-palette', '#6f42c1', 'Work Order Color Rules', 'Task bar colors are controlled by Work Order Type + Status combinations.', 'Each color rule uses the key format TYPE#STATUS, for example BRKD#R. The matching color is applied when a task has the same EVT_JOBTYPE and EVT_STATUS.') +
        row('fa-edit', '#0d6efd', configScope, 'Controls which columns are shown and which colors are used.', 'Users choose column names only. DSELECT is fixed to EVT_DUE, EVT_SCHEDEND, EVT_TARGET, EVT_UDFDATE01, and EVT_UDFDATE02; all other columns are SELECT.') +
        row('fa-trash', '#dc3545', 'Column/Color Deletion', 'Editable configuration rows can be removed from the popup.', 'Deleted columns are excluded from both SELECT and DSELECT on save. Deleted color rows no longer apply to matching work orders.') +
      '</ul>' +

      '<h3 style="' + sectionStyle + '">Configuration Security</h3>' +
      '<ul style="' + listStyle + '">' +
        row('fa-user', '#0d6efd', 'User Mode', 'Users maintain Layout Configuration in USER_GANTT_CONFIGURATION_JSON.', 'The default setup is read from the maintained DEFAULT_GANTT_CONFIGURATION_JSON record.') +
        row('fa-users', '#6f42c1', 'Customer Mode', 'One shared customer configuration is used for the deployment.', 'The shared record id is CUSTOMER_GANTT_CONFIGURATION_JSON. Only configured administrators can edit it.') +
        row('fa-lock', '#dc3545', 'Read-only Users', 'In customer mode, non-admin users can view the configuration but cannot change columns or colors.', 'Current administrators: ' + (adminUsers || '-') + '. Current edit access: ' + (canEditConfig ? 'Allowed' : 'Read only') + '.') +
      '</ul>' +

      '<h3 style="' + sectionStyle + '">Filtering And Summary</h3>' +
      '<ul style="' + listStyle + '">' +
        row('fa-filter', '#6c757d', 'Column Filters', 'Filters inside grid columns hide or show tasks client-side.', 'Column filters apply to the currently loaded Gantt tasks.') +
        // Temporarily hidden from the legend; retain for future Summary Filter use.
        // row('fa-chart-pie', '#0d6efd', 'Summary Filters', 'Summary cards filter by Type, Department, Status, or Due Date group.', 'When a summary filter is active, a toolbar indicator appears. Click the indicator to remove the summary filter.') +
        row('fa-exclamation-triangle', '#dc3545', 'Due Date Exceeded', 'A work order is considered exceeded when scheduled end is later than due date.', 'Logic: EVT_SCHEDEND must be greater than EVT_DUE. Work orders ending on or before due date are not exceeded.') +
      '</ul>' +

      '<h3 style="' + sectionStyle + '">Schedule Editing</h3>' +
      '<ul style="' + listStyle + '">' +
        row('fa-arrows-alt', '#0066cc', 'Drag And Drop', 'Move task bars to reschedule work orders.', 'Modified tasks are tracked until Save Changes is completed or Refresh discards them.') +
        row('fa-arrows-h', '#28a745', 'Resize Tasks', 'Drag task edges to change schedule duration.', 'The pending changes popup displays old and new start/end dates before saving.') +
        row('fa-undo', '#dc3545', 'Revert Single Change', 'Reverts one modified work order before saving.', 'Revert restores the original inclusive schedule range and updates the pending count.') +
        row('fa-mouse-pointer', '#ff6600', 'Double Click', 'Opens detailed work order information.', 'The details popup shows field/value data for the selected work order.') +
        row('fa-mouse-pointer', '#ffc107', 'Right Click', 'Opens quick actions for the selected task.', 'Context actions are controlled by the task and screen state.') +
        row('fa-eye', '#17a2b8', 'Hover', 'Shows quick task tooltip details.', 'Tooltip content follows the currently loaded work order data.') +
      '</ul>' +

      '<h3 style="' + sectionStyle + '">Status Indicators</h3>' +
      '<ul style="' + listStyle + '">' +
        row('fa-wrench', '#0066cc', 'Work Order', 'The blue wrench identifies an actual Work Order.', 'This icon distinguishes released Work Orders from future planning events.') +
        row('fa-hourglass-half', '#d97706', 'Future Event', 'The orange hourglass identifies a Future Event.', 'When available, its sequence number is displayed with the hourglass.') +
        '<li style="margin-bottom:9px;"><span style="background:#ff6600;color:white;padding:4px 12px;border-radius:12px;font-weight:bold;">Orange Badge</span> <b>Modified Tasks:</b> Number of unsaved schedule changes.</li>' +
        '<li style="margin-bottom:9px;"><span style="background:#28a745;color:white;padding:4px 12px;border-radius:12px;font-weight:bold;">Green Badge</span> <b>Total WOs:</b> Number of work orders currently visible after filters.</li>' +
        // Temporarily hidden from the legend; retain for future Filter Badge use.
        // '<li style="margin-bottom:9px;"><span style="background:#fff3cd;color:#7a4f01;border:1px solid #ffc107;padding:4px 12px;border-radius:12px;font-weight:bold;">Filter Badge</span> <b>Summary Filter:</b> Indicates that a summary filter is active and can be cleared.</li>' +
        '<li style="margin-bottom:9px;"><span style="color:#dc3545;font-weight:bold;">Red Due Flag</span> <b>Due Date Present:</b> A red flag on the task bar marks the work order due date when the flag option is enabled.</li>' +
      '</ul>' +
    '</div>';
  }

  // ==========================================================================
  // 09. Header and Legend
  // ==========================================================================
  function showSystemLegendPopup() {
    var cfgState = function(enabled, label) {
      return '<span style="font-size:10px;background:' + (enabled ? '#d4edda' : '#e9ecef') + ';color:' + (enabled ? '#155724' : '#6c757d') + ';border:1px solid ' + (enabled ? '#c3e6cb' : '#d6d8db') + ';padding:1px 7px;border-radius:8px;margin-left:8px;">' + label + '</span>';
    };
    var legendWindow = Ext.create('Ext.window.Window', {
      cls: 'iux-product-window',
      title: '<i class="fa fa-info-circle" style="margin-right:8px;"></i><b style="color:white;">System Legend</b>',
      width: 700,
      height: 560,
      modal: true,
      scrollable: true,
      bodyPadding: 15,
      header: { style: { 'background-color': '#383838', 'color': '#ffffff' } },
      style: { 'border-radius': '8px' },
      html: buildSystemLegendHtml(cfgState),
      buttons: [{
        text: '<i class="fa fa-times"></i> Close',
        handler: function() { legendWindow.close(); }
      }],
      buttonAlign: 'center'
    });
    legendWindow.show();
  }

  function getTaskScheduleStartDate(task) {
    if (!task) return null;
    var start = task.modified && task.start_date ? analyticsDate(task.start_date) : analyticsDate(task.originalStart || task.EVT_TARGET || task.start_date);
    return start ? new Date(start.getFullYear(), start.getMonth(), start.getDate()) : null;
  }

  function getTaskScheduleEndInclusiveDate(task) {
    if (!task) return null;
    if (task.modified && task.end_date) {
      var modifiedEnd = analyticsDate(task.end_date);
      if (modifiedEnd) {
        modifiedEnd.setDate(modifiedEnd.getDate() - 1);
        return new Date(modifiedEnd.getFullYear(), modifiedEnd.getMonth(), modifiedEnd.getDate());
      }
    }
    var end = analyticsDate(task.originalEnd || task.EVT_SCHEDEND || task.end_date);
    return end ? new Date(end.getFullYear(), end.getMonth(), end.getDate()) : null;
  }

  function getVisibleScheduledWorkOrdersForDate(dateKey) {
    var targetDate = analyticsDate(dateKey);
    var rows = [];
    if (!targetDate || typeof gantt === 'undefined' || !gantt.eachTask) return rows;
    targetDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());

    gantt.eachTask(function(task) {
      if (task._summaryVisible === false || task._columnVisible === false || !isSearchSuccess(task.id, task)) return;
      var start = getTaskScheduleStartDate(task);
      var end = getTaskScheduleEndInclusiveDate(task) || start;
      if (!start || !end) return;
      if (targetDate >= start && targetDate <= end) rows.push(task);
    });

    rows.sort(function(a, b) {
      return String(a.EVT_CODE || '').localeCompare(String(b.EVT_CODE || ''));
    });
    return rows;
  }

  function showScheduledWorkOrdersForDatePopup(dateKey) {
    var date = analyticsDate(dateKey);
    if (!date) return;
    var rows = getVisibleScheduledWorkOrdersForDate(dateKey);
    var displayDate = formatDateDMY(date);
    var html = '<div class="iux-day-schedule-popup">' +
      '<div class="iux-day-schedule-hero">' +
        '<div><div class="iux-day-schedule-title">' + safeHtml(displayDate) + '</div>' +
        '<div class="iux-day-schedule-subtitle">Visible work orders scheduled on this calendar date.</div></div>' +
        '<span class="iux-day-schedule-count">' + rows.length + ' WO(s)</span>' +
      '</div>';

    if (!rows.length) {
      html += '<div class="iux-day-schedule-empty">No visible work orders are scheduled on this date.</div>';
    } else {
      html += '<table class="iux-day-schedule-table"><thead><tr><th>WO</th><th>Description</th><th>Status</th><th>Type</th><th>Org</th><th>Start</th><th>End</th><th>Hours</th></tr></thead><tbody>';
      rows.forEach(function(task) {
        var start = getTaskScheduleStartDate(task);
        var end = getTaskScheduleEndInclusiveDate(task) || start;
        html += '<tr>' +
          '<td><a data-wo-code="' + safeHtml(task.EVT_CODE || '') + '" class="gantt-review-wo">' + safeHtml(task.EVT_CODE || '-') + '</a></td>' +
          '<td>' + safeHtml(task.EVT_DESC || task.text || '-') + '</td>' +
          '<td>' + safeHtml(task.EVT_STATUS_DESC || task.EVT_STATUS || '-') + '</td>' +
          '<td>' + safeHtml(task.EVT_JOBTYPE_DESC || task.EVT_JOBTYPE || '-') + '</td>' +
          '<td>' + safeHtml(task.EVT_ORG || '-') + '</td>' +
          '<td>' + safeHtml(start ? formatDateDMY(start) : '-') + '</td>' +
          '<td>' + safeHtml(end ? formatDateDMY(end) : '-') + '</td>' +
          '<td>' + safeHtml(task.ACT_EST || '-') + '</td>' +
        '</tr>';
      });
      html += '</tbody></table>';
    }

    html += '</div>';

    if (Ext.getCmp('iuxDayScheduleWin')) Ext.getCmp('iuxDayScheduleWin').destroy();
    var win = Ext.create('Ext.window.Window', {
      id: 'iuxDayScheduleWin',
      cls: 'iux-product-window',
      title: '<i class="fa fa-calendar" style="margin-right:8px;"></i><b style="color:white;">Scheduled Work Orders - ' + safeHtml(displayDate) + '</b>',
      width: 920,
      height: 520,
      modal: true,
      scrollable: true,
      bodyPadding: 0,
      html: html,
      header: { style: { 'background-color': '#383838', 'color': '#ffffff' } },
      buttons: [{
        text: '<i class="fa fa-times" style="margin-right:5px;"></i>Close',
        handler: function() { win.close(); }
      }],
      listeners: {
        afterrender: function(w) {
          var el = w.getEl().dom;
          el.addEventListener('click', function(e) {
            var link = e.target && e.target.getAttribute('data-wo-code') ? e.target : null;
            if (!link) return;
            var vParameters = {};
            vParameters.SYSTEM_FUNCTION_NAME = 'WSJOBS';
            vParameters.USER_FUNCTION_NAME = 'WSJOBS';
            vParameters.CURRENT_TAB_NAME = "HDR";
            vParameters.initpath = "WSJOBS";
            vParameters.filterfields = "workordernum";
            vParameters.filteroperator = encodeURIComponent("=");
            vParameters.filtervalue = link.getAttribute('data-wo-code');
            openHyperlink(vParameters);
          });
        }
      }
    });
    win.show();
  }

  function showConfigPopup() {
    if (Ext.getCmp('ganttConfigWin')) Ext.getCmp('ganttConfigWin').destroy();

    var wkChecked  = gGanttGlobal.ganttConfig.highlightWeekends           ? 'checked' : '';
    var ohChecked  = gGanttGlobal.ganttConfig.highlightOrgHolidays        ? 'checked' : '';
    var nhChecked  = gGanttGlobal.ganttConfig.highlightNationalHolidays   ? 'checked' : '';
    var ddChecked  = gGanttGlobal.ganttConfig.highlightDueDates          ? 'checked' : '';
    var dfChecked  = gGanttGlobal.ganttConfig.highlightDueDateFlags      ? 'checked' : '';
    var sdChecked  = gGanttGlobal.ganttConfig.highlightShutdownDates      ? 'checked' : '';
    var configHTML =
      '<div style="font-family:Arial,sans-serif;">' +
        // ── Row 1: Highlight Weekends ────────────────────────────────────
        '<div class="gantt-cfg-row" id="cfg-row-weekends">' +
          '<label class="gantt-cfg-toggle">' +
            '<input type="checkbox" id="cfg-highlight-weekends" ' + wkChecked + '>' +
            '<span class="gantt-cfg-slider"></span>' +
          '</label>' +
          '<div>' +
            '<div style="font-weight:bold;font-size:13px;color:#1a1a1a;"><i class="fa fa-calendar-week" style="color:#0066cc;margin-right:6px;"></i>Highlight Weekends</div>' +
            '<div style="font-size:11px;color:#888;margin-top:3px;">Shade Saturday &amp; Sunday columns in the timeline</div>' +
          '</div>' +
        '</div>' +
        // ── Row 2: Highlight Customer Specific Dates ─────────────────────
        '<div class="gantt-cfg-row" id="cfg-row-duedate">' +
          '<label class="gantt-cfg-toggle">' +
            '<input type="checkbox" id="cfg-highlight-due" ' + ddChecked + '>' +
            '<span class="gantt-cfg-slider"></span>' +
          '</label>' +
          '<div>' +
            '<div style="font-weight:bold;font-size:13px;color:#1a1a1a;"><i class="fa fa-calendar-check" style="color:#dc3545;margin-right:6px;"></i>Highlight Customer Specific Dates</div>' +
            '<div style="font-size:11px;color:#888;margin-top:3px;">Mark the EVT_UDFDATE01 cell for each Work Order in the timeline</div>' +
          '</div>' +
        '</div>' +
        // ── Row 3: Highlight Org Holidays (COMING SOON) ─────────────────
        '<div class="gantt-cfg-row" id="cfg-row-dueflag">' +
          '<label class="gantt-cfg-toggle">' +
            '<input type="checkbox" id="cfg-highlight-due-flag" ' + dfChecked + '>' +
            '<span class="gantt-cfg-slider"></span>' +
          '</label>' +
          '<div>' +
            '<div style="font-weight:bold;font-size:13px;color:#1a1a1a;"><i class="fa fa-flag" style="color:#dc3545;margin-right:6px;"></i>Show Due Date Flag</div>' +
            '<div style="font-size:11px;color:#888;margin-top:3px;">Show a small red due-date flag on each Work Order task bar</div>' +
          '</div>' +
        '</div>' +
        '<div class="gantt-cfg-row" id="cfg-row-shutdown">' +
          '<label class="gantt-cfg-toggle">' +
            '<input type="checkbox" id="cfg-highlight-shutdown" ' + sdChecked + '>' +
            '<span class="gantt-cfg-slider"></span>' +
          '</label>' +
          '<div>' +
            '<div style="font-weight:bold;font-size:13px;color:#1a1a1a;"><i class="fa fa-industry" style="color:#6f42c1;margin-right:6px;"></i>Highlight Shutdown Dates</div>' +
            '<div style="font-size:11px;color:#888;margin-top:3px;">Shade dates from target start to scheduled end for shutdown work orders</div>' +
          '</div>' +
        '</div>' +
        '<div class="gantt-cfg-row">' +
          '<label class="gantt-cfg-toggle">' +
            '<input type="checkbox" id="cfg-highlight-org-holidays" ' + ohChecked + '>' +
            '<span class="gantt-cfg-slider"></span>' +
          '</label>' +
          '<div>' +
            '<div style="font-weight:bold;font-size:13px;color:#1a1a1a;">' +
              '<i class="fa fa-building" style="color:#6c757d;margin-right:6px;"></i>Highlight Organization Holidays' +
            '</div>' +
            '<div style="font-size:11px;color:#888;margin-top:3px;">Shade configured organization holidays and special days</div>' +
          '</div>' +
        '</div>' +
        // ── Row 4: Highlight National Holidays (US Federal) ─────────────
        '<div class="gantt-cfg-row">' +
          '<label class="gantt-cfg-toggle">' +
            '<input type="checkbox" id="cfg-highlight-national" ' + nhChecked + '>' +
            '<span class="gantt-cfg-slider"></span>' +
          '</label>' +
          '<div>' +
            '<div style="font-weight:bold;font-size:13px;color:#1a1a1a;">' +
              '<i class="fa fa-flag" style="color:#dc3545;margin-right:6px;"></i>Highlight National Holidays' +
              '<span style="font-size:10px;background:#fff3cd;color:#856404;border:1px solid #ffc107;padding:1px 7px;border-radius:8px;margin-left:8px;">US Federal</span>' +
            '</div>' +
            '<div style="font-size:11px;color:#888;margin-top:3px;">' +
              'Shade all 11 US federal holidays &mdash; New Year\'s, MLK, Presidents\', Memorial, Juneteenth, Independence, Labor, Columbus, Veterans, Thanksgiving, Christmas' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    var configWin = Ext.create('Ext.window.Window', {
      id: 'ganttConfigWin',
      cls: 'iux-product-window',
      title: '<i class="fa fa-cog" style="margin-right:8px;"></i><b style="color:white;">Configuration</b>',
      width: 460,
      height: 640,
      modal: true,
      resizable: false,
      scrollable: true,
      bodyPadding: 0,
      header: { style: { 'background-color': '#383838', 'color': '#ffffff' } },
      style: { 'border-radius': '8px' },
      html: configHTML,
      listeners: {
        afterrender: function(win) {
          win.getEl().dom.addEventListener('change', function(e) {
            if (!e.target) return;
            if (e.target.id === 'cfg-highlight-weekends') {
              gGanttGlobal.ganttConfig.highlightWeekends = e.target.checked;
              if (typeof gantt !== 'undefined' && gantt.render) gantt.render();
            }
            if (e.target.id === 'cfg-highlight-national') {
              gGanttGlobal.ganttConfig.highlightNationalHolidays = e.target.checked;
              // Bust cache so toggling picks up fresh data
              gGanttGlobal._usHolidayCache = {};
              gGanttGlobal._timelineCellClassCache = {};
              if (typeof gantt !== 'undefined' && gantt.render) gantt.render();
            }
            if (e.target.id === 'cfg-highlight-org-holidays') {
              gGanttGlobal.ganttConfig.highlightOrgHolidays = e.target.checked;
              gGanttGlobal._configuredHolidayCache = {};
              gGanttGlobal._timelineCellClassCache = {};
              if (typeof gantt !== 'undefined' && gantt.render) gantt.render();
            }
            if (e.target.id === 'cfg-highlight-shutdown') {
              gGanttGlobal.ganttConfig.highlightShutdownDates = e.target.checked;
              if (typeof gantt !== 'undefined' && gantt.render) gantt.render();
            }
            if (e.target.id === 'cfg-highlight-due-flag') {
              gGanttGlobal.ganttConfig.highlightDueDateFlags = e.target.checked;
              if (typeof gantt !== 'undefined' && gantt.render) gantt.render();
            }
                  // Customer specific date cell toggle
            if (e.target.id === 'cfg-highlight-due') {
              gGanttGlobal.ganttConfig.highlightDueDates = e.target.checked;
              if (typeof gantt !== 'undefined' && gantt.render) gantt.render();
            }
    
          });
        }
      },
      buttons: [{
        text: '<i class="fa fa-times" style="margin-right:4px;"></i>Close',
        handler: function() { configWin.close(); }
      }],
      buttonAlign: 'right'
    });
    configWin.show();
  }

  // ==========================================================================
  // 10. Schedule Review and Save
  // ==========================================================================
  function showChangesReviewPopup() {
    if (!gGanttGlobal.TasksModified || gGanttGlobal.TasksModified.length === 0) {
      EAM.Messaging.showConfirmation('No pending changes to review.');
      return;
    }

    ensureProfessionalPopupStyles();

    var rows = '';
    gGanttGlobal.TasksModified.forEach(function(id) {
      var change = gGanttGlobal.PendingChanges[id];
      if (!change) return;
      var task = gantt.getTask(id);
      var oldStart = change.oldStart ? formatDateDMY(change.oldStart) : '-';
      var oldEnd   = change.oldEnd   ? formatDateDMY(change.oldEnd)   : '-';
      var newStart = change.newStart ? formatDateDMY(change.newStart) : '-';
      var adjustedEnd = change.newEnd ? new Date(change.newEnd.getTime() - 1) : null;
      var newEnd = adjustedEnd ? formatDateDMY(adjustedEnd) : '-';
      var oldDays = (change.oldStart && change.oldEnd) ? getInclusiveCalendarDayCount(change.oldStart, change.oldEnd) : '-';
      var newDays = (change.newStart && adjustedEnd) ? getInclusiveCalendarDayCount(change.newStart, adjustedEnd) : '-';
      var moveDays = (change.oldStart && change.newStart) ? getCalendarDayDiff(change.oldStart, change.newStart) : 0;
      var durationDelta = (oldDays !== '-' && newDays !== '-') ? (newDays - oldDays) : 0;
      var moveText = moveDays === 0 ? 'No date movement' : ('Moved ' + (moveDays > 0 ? '+' : '') + moveDays + ' day(s)');
      var durationText = durationDelta === 0 ? '' : ', Duration ' + (durationDelta > 0 ? '+' : '') + durationDelta + ' day(s)';
      rows +=
        '<tr id="review-row-' + id + '">' +
          '<td>' +
            '<a data-wo-code="' + (change.woCode || id) + '" data-wo-org="' + (change.woOrg || '') + '" ' +
            'class="gantt-review-wo">' + safeHtml(change.woCode || id) + '</a>' +
            '<div class="gantt-review-meta">' + safeHtml(task && task.EVT_DESC) + '</div>' +
          '</td>' +
          '<td>' +
            '<span class="gantt-review-chip">' + safeHtml(change.woOrg || '-') + '</span>' +
            '<div class="gantt-review-meta">Status: ' + safeHtml(task && (task.EVT_STATUS_DESC || task.EVT_STATUS)) + '</div>' +
          '</td>' +
          '<td><div class="gantt-review-date gantt-review-old">' + safeHtml(oldStart) + ' &rarr; ' + safeHtml(oldEnd) + '</div><div class="gantt-review-meta">' + safeHtml(oldDays) + ' day(s)</div></td>' +
          '<td><div class="gantt-review-date gantt-review-new">' + safeHtml(newStart) + ' &rarr; ' + safeHtml(newEnd) + '</div><div class="gantt-review-meta">' + safeHtml(newDays) + ' day(s), ' + safeHtml(moveText + durationText) + '</div></td>' +
          '<td id="review-status-' + id + '" style="text-align:center;font-size:15px;min-width:90px;"></td>' +
          '<td style="text-align:center;">' +
            '<button data-revert-id="' + id + '" id="review-revert-' + id + '" ' +
              'class="gantt-review-revert">' +
              '<i class="fa fa-undo"></i> Revert</button>' +
          '</td>' +
        '</tr>';
    });

    var tableHTML =
      '<div class="gantt-popup-shell">' +
        '<div class="gantt-popup-hero">' +
          '<div><div class="gantt-popup-title">Review Pending Changes</div>' +
          '<div class="gantt-popup-subtitle">Confirm schedule adjustments before saving. Work order links open the source record; Revert restores a single row.</div></div>' +
          '<div class="gantt-popup-statbar">' +
            '<div class="gantt-popup-stat"><strong id="gantt-review-pending-count">' + gGanttGlobal.TasksModified.length + '</strong><span>Pending</span></div>' +
          '</div>' +
        '</div>' +
        '<div style="padding:14px 16px;">' +
        '<table id="gantt-review-table" class="gantt-review-table">' +
          '<thead>' +
            '<tr>' +
              '<th>Work Order</th>' +
              '<th>Org / Status</th>' +
              '<th>Old Schedule</th>' +
              '<th>New Schedule</th>' +
              '<th style="text-align:center;">Save Status</th>' +
              '<th style="text-align:center;">Action</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody>' + rows + '</tbody>' +
        '</table>' +
        '</div>' +
      '</div>';

    if (Ext.getCmp('ganttReviewWin')) Ext.getCmp('ganttReviewWin').destroy();

    var reviewWin = Ext.create('Ext.window.Window', {
      id: 'ganttReviewWin',
      cls: 'iux-product-window',
      title: '<i class="fa fa-list-alt" style="margin-right:8px;"></i><b style="color:white;">Review Pending Changes (' + gGanttGlobal.TasksModified.length + ')</b>',
      width: 920,
      height: 540,
      modal: true,
      scrollable: true,
      bodyPadding: 0,
      header: {
        style: { 'background-color': '#383838', 'color': '#ffffff' }
      },
      style: { 'border-radius': '8px' },
      html: tableHTML,
      listeners: {
        afterrender: function(win) {
          // Attach click handlers via event delegation — avoids inline onclick/global scope issues
          var bodyEl = win.getEl().dom;
          bodyEl.addEventListener('click', function(e) {
            // ── Revert button ──
            var btn = e.target.closest ? e.target.closest('[data-revert-id]') : null;
            if (!btn && e.target.getAttribute) {
              btn = e.target.getAttribute('data-revert-id') ? e.target : null;
            }
            if (btn) {
              var rowId = btn.getAttribute('data-revert-id');
              if (rowId) revertSingleChange(rowId);
              return;
            }
            // ── Work Order hyperlink ──
            var woLink = e.target.closest ? e.target.closest('[data-wo-code]') : null;
            if (woLink) {
              var woCode = woLink.getAttribute('data-wo-code');
              if (woCode) {
                var vParameters = {};
                vParameters.SYSTEM_FUNCTION_NAME = 'WSJOBS';
                vParameters.USER_FUNCTION_NAME   = 'WSJOBS';
                vParameters.CURRENT_TAB_NAME     = 'HDR';
                vParameters.initpath             = 'WSJOBS';
                vParameters.filterfields         = 'workordernum';
                vParameters.filteroperator       = encodeURIComponent('=');
                vParameters.filtervalue          = woCode;
                openHyperlink(vParameters);
              }
            }
          });
        }
      },
      buttons: [
        {
          xtype: 'component',
          html: '<span style="color:#555;font-size:11px;line-height:28px;padding-left:8px;">' +
                '<i class="fa fa-info-circle" style="color:#1a5276;margin-right:4px;"></i>' +
                'Click <b>Revert</b> to undo a single change before saving.</span>',
          flex: 1
        },
        {
          text: '<i class="fa fa-save" style="margin-right:6px;"></i>Save All',
          id: 'ganttReviewSaveAll',
          style: { 'background-color': '#28a745', 'border-color': '#1e7e34', 'color': 'white' },
          handler: function() { submitAllPendingChanges(); }
        },
        {
          text: '<i class="fa fa-times" style="margin-right:4px;"></i>Close',
          margin: '5 5 5 5',
          handler: function() { reviewWin.close(); }
        }
      ],
      buttonAlign: 'right'
    });
    reviewWin.show();
  }

  function updateReviewPendingPopupCount() {
    var reviewWin = Ext.getCmp('ganttReviewWin');
    if (reviewWin) {
      reviewWin.setTitle('<i class="fa fa-list-alt" style="margin-right:8px;"></i><b style="color:white;">Review Pending Changes (' + gGanttGlobal.TasksModified.length + ')</b>');
    }

    var statEl = document.getElementById('gantt-review-pending-count');
    if (statEl) {
      statEl.innerHTML = gGanttGlobal.TasksModified.length;
    }
  }

  function revertSingleChange(id) {
    var change = gGanttGlobal.PendingChanges[id];
    if (!change || !change.oldStart) return;

    gGanttGlobal.suppressChangeTracking = true;
    var task = gantt.getTask(id);
    if (task) {
      task.start_date = new Date(change.oldStart);
      task.end_date   = toGanttExclusiveEndDate(change.oldEnd);
      task.modified   = 0;
      gantt.updateTask(id);
    }
    gGanttGlobal.suppressChangeTracking = false;

    delete gGanttGlobal.PendingChanges[id];
    gGanttGlobal.TasksModified = gGanttGlobal.TasksModified.filter(function(i) { return i !== id; });

    var row = document.getElementById('review-row-' + id);
    if (row) row.parentNode.removeChild(row);
    updateReviewPendingPopupCount();

    rebuildShutdownDateCacheFromGantt();
    gantt.render();
    gantt.sort('start_date', false);
    updateHeader();

    if (gGanttGlobal.TasksModified.length === 0) {
      Ext.getCmp('submitGanttNow').removeCls('highlight-button');
      if (Ext.getCmp('ganttReviewWin')) Ext.getCmp('ganttReviewWin').close();
    }
  }

  function submitAllPendingChanges() {
    var saveBtn = Ext.getCmp('ganttReviewSaveAll');
    if (saveBtn) {
      saveBtn.setText('<i class="fa fa-spinner fa-spin" style="margin-right:6px;"></i>Saving...');
      saveBtn.disable();
    }

    var idsToProcess = gGanttGlobal.TasksModified.slice();
    var successCount = 0;
    var failCount    = 0;
    var index        = 0;

    // Pre-mark every row as "Queued" so the user sees what is coming
    idsToProcess.forEach(function(id) {
      var statusEl = document.getElementById('review-status-' + id);
      if (statusEl) statusEl.innerHTML = '<span style="color:#aaaaaa;font-style:italic;">&#9679; Queued</span>';
    });

    function processNext() {
      if (index >= idsToProcess.length) {
        // ── All records processed – finalise ──────────────────────────────
        if (saveBtn) {
          saveBtn.setText('<i class="fa fa-save" style="margin-right:6px;"></i>Save All');
          saveBtn.enable();
        }
        updateHeader();
        gantt.render();
        gantt.sort('start_date', false);
        if (gGanttGlobal.TasksModified.length === 0) {
          Ext.getCmp('submitGanttNow').removeCls('highlight-button');
          Ext.getCmp('reloadGanttNow').removeCls('highlight-button');
        }
        var msg = successCount + ' record(s) saved successfully';
        if (failCount > 0) msg += ', ' + failCount + ' failed (see red rows in the grid)';
        msg += '.';
        EAM.Messaging.showConfirmation(msg);
        return;
      }

      var id        = idsToProcess[index];
      index++;

      var statusEl  = document.getElementById('review-status-' + id);
      var revertBtn = document.getElementById('review-revert-' + id);

      // Mark current row as actively saving – browser will paint this before the next setTimeout fires
      if (statusEl) statusEl.innerHTML = '<span style="color:#f39c12;font-weight:bold;"><i class="fa fa-spinner fa-spin" style="margin-right:3px;"></i>Saving</span>';

      // setTimeout(0) yields to the browser render engine so the "Saving" state paints
      // before the synchronous AJAX call below blocks the thread
      setTimeout(function() {
        try {
          var task = gantt.getTask(id);
          var WORecord = EAM.Ajax.request({
            url: "WSJOBS.HDR",
            params: {
              SYSTEM_FUNCTION_NAME: "WSJOBS",
              USER_FUNCTION_NAME: "WSJOBS",
              CURRENT_TAB_NAME: "HDR",
              CHECK_CF_CHANGEFLAG: true,
              workordernum: task.EVT_CODE,
              organization: task.EVT_ORG,
              pagemode: "view"
            }
          }).responseData.pageData.values;

          for (var k in WORecord) {
            if (Ext.isObject(WORecord[k])) WORecord[k] = WORecord[k].selected;
          }

          WORecord.schedstartdate = formatDate(task.start_date);
          WORecord.schedenddate   = formatDate2(task.end_date);

          var parsedActStart = EAM.utils.Date.parseDate(WORecord.actstartdate);
          var parsedActEnd = EAM.utils.Date.parseDate(WORecord.actenddate);
          var parsedSchedStart = EAM.utils.Date.parseDate(WORecord.schedstartdate);
          var parsedSchedEnd = EAM.utils.Date.parseDate(WORecord.schedenddate);

          if (parsedActStart && parsedSchedStart) {
            var dStart = new Date(parsedActStart);
            dStart.setDate(dStart.getDate() + EAM.utils.Date.diffDays(parsedActStart, parsedSchedStart));
            WORecord.actstartdate = formatDate(new Date(dStart.getFullYear(), dStart.getMonth(), dStart.getDate(), '00', '00'));
          }
          if (parsedActEnd && parsedSchedEnd) {
            var dEnd = new Date(parsedActEnd);
            dEnd.setDate(dEnd.getDate() + EAM.utils.Date.diffDays(parsedActEnd, parsedSchedEnd));
            WORecord.actenddate = formatDate(new Date(dEnd.getFullYear(), dEnd.getMonth(), dEnd.getDate(), '00', '00'));
          }

          var vResult = EAM.Ajax.request({
            url: "WSJOBS.HDR?pageaction=SAVE",
            params: Ext.merge(WORecord, {
              SYSTEM_FUNCTION_NAME: "WSJOBS",
              USER_FUNCTION_NAME: "WSJOBS",
              CURRENT_TAB_NAME: "HDR",
              CHECK_CF_CHANGEFLAG: true,
              can_update: true,
              pagemode: "view"
            })
          });

          if (vResult.success) {
            successCount++;
            task.modified = 0;
            delete gGanttGlobal.PendingChanges[id];
            gGanttGlobal.TasksModified = gGanttGlobal.TasksModified.filter(function(i) { return i !== id; });
            if (statusEl)  statusEl.innerHTML = '<span style="color:#28a745;font-weight:bold;" title="Saved successfully">&#10003; Scheduled</span>';
            if (revertBtn) revertBtn.style.display = 'none';
          } else {
            failCount++;
            if (statusEl) statusEl.innerHTML = '<span style="color:#dc3545;font-weight:bold;" title="Save failed">&#10007; Failed</span>';
          }
        } catch(e) {
          failCount++;
          var errMsg = (e && e.message) ? e.message : String(e);
          if (statusEl) statusEl.innerHTML = '<span style="color:#dc3545;font-weight:bold;" title="Error: ' + errMsg + '">&#10007; Error</span>';
        }

        // Yield again so the result paints, then move to the next record
        setTimeout(processNext, 0);
      }, 0);
    }

    // Kick off the chain
    processNext();
  }

  function getHeaderVisibleWorkOrders() {
    var tasks = [];

    // Get all active filter inputs
    var textFilterInputs = document.querySelectorAll('input[data-text-filter]');
    var dateFilterInputs = document.querySelectorAll('input[data-date-filter]');
    
    // Collect tasks that pass all active filters
    gantt.eachTask(function(task) {
        var shouldDisplay = true;
        
        // Check text filters
        textFilterInputs.forEach(function(input) {
            var filterValue = input.value.trim();
            if (filterValue !== '') {
                var columnName = input.getAttribute('data-text-filter');
                var taskValue = task[columnName] || '';
                if (typeof taskValue !== 'string') {
                    taskValue = String(taskValue);
                }
                if (!taskValue.toLowerCase().includes(filterValue.toLowerCase())) {
                    shouldDisplay = false;
                }
            }
        });
        
        // Check date filters
        dateFilterInputs.forEach(function(input) {
            var filterValue = input.value.trim();
            if (filterValue !== '') {
                var columnName = input.getAttribute('data-date-filter');
                var taskValue = task[columnName];
                if (taskValue) {
                    // Simple date string comparison - you may need to adjust this based on your date format
                    var taskDateStr = '';
                    if (taskValue instanceof Date) {
                        taskDateStr = taskValue.toLocaleDateString();
                    } else {
                        taskDateStr = String(taskValue);
                    }
                    if (!taskDateStr.toLowerCase().includes(filterValue.toLowerCase())) {
                        shouldDisplay = false;
                    }
                } else {
                    // If task has no date value but filter is set, exclude it
                    shouldDisplay = false;
                }
            }
        });
        
        // Respect explicit visibility toggles (summary and column filters)
        if (shouldDisplay && task._summaryVisible !== false && task._columnVisible !== false) {
          tasks.push(task);
        }
    });

    return tasks;
  }

function getHeaderWorkOrderMetrics() {
    var metrics = {
      count: 0,
      estimatedHours: 0
    };
    
    getHeaderVisibleWorkOrders().forEach(function(task) {
      metrics.count++;
      metrics.estimatedHours += analyticsNumber(task.ACT_EST || task.act_est);
    });
    
    return metrics;
  }

  function buildEstimatedHoursByTradeRows() {
    var byTrade = {};
    getHeaderVisibleWorkOrders().forEach(function(task) {
      var hours = analyticsNumber(task.ACT_EST || task.act_est);
      var trades = analyticsTrades(task.LISTOFTRADES || task.listoftrades);
      if (!trades.length) trades = ['No Trade'];
      var share = trades.length ? hours / trades.length : hours;
      trades.forEach(function(trade) {
        if (!byTrade[trade]) byTrade[trade] = { trade: trade, hours: 0, workOrders: 0 };
        byTrade[trade].hours += share;
        byTrade[trade].workOrders += 1;
      });
    });
    return Object.keys(byTrade).map(function(trade) {
      return byTrade[trade];
    }).sort(function(a, b) {
      return b.hours - a.hours;
    });
  }

  function showEstimatedHoursByTradePopup() {
    var rows = buildEstimatedHoursByTradeRows();
    var totalHours = rows.reduce(function(total, row) {
      return total + analyticsNumber(row.hours);
    }, 0);
    var bodyHtml = '<div class="iux-analytics-shell">' +
      '<div class="iux-analytics-kpis">' +
        '<div class="iux-analytics-kpi"><b>' + analyticsHours(totalHours) + '</b><span>Total Estimated Hours</span></div>' +
        '<div class="iux-analytics-kpi"><b>' + rows.length + '</b><span>Trade Groups</span></div>' +
      '</div>' +
      '<table class="iux-analytics-table">' +
        '<thead><tr><th>Trade</th><th>Estimated Hours</th><th>WO Count</th></tr></thead>' +
        '<tbody>';

    if (!rows.length) {
      bodyHtml += '<tr><td colspan="3" class="iux-analytics-empty">No visible work orders found.</td></tr>';
    } else {
      rows.forEach(function(row) {
        bodyHtml += '<tr>' +
          '<td>' + safeHtml(row.trade) + '</td>' +
          '<td>' + analyticsHours(row.hours) + 'h</td>' +
          '<td>' + row.workOrders + '</td>' +
        '</tr>';
      });
    }

    bodyHtml += '</tbody></table>' +
      '<div class="iux-analytics-footnote">When a work order has multiple trades, its ACT_EST is split evenly across those trades.</div>' +
    '</div>';

    if (Ext.getCmp('ganttEstimatedHoursByTradeWin')) Ext.getCmp('ganttEstimatedHoursByTradeWin').destroy();

    var viewportSize = Ext.getBody().getViewSize();
    Ext.create('Ext.window.Window', {
      id: 'ganttEstimatedHoursByTradeWin',
      cls: 'iux-product-window',
      title: '<i class="fa fa-clock-o" style="margin-right:8px;"></i><b style="color:white;">Estimated Hours by Trade</b>',
      width: Math.min(620, Math.floor(viewportSize.width * 0.72)),
      height: Math.min(520, Math.floor(viewportSize.height * 0.72)),
      modal: true,
      bodyPadding: 0,
      scrollable: true,
      html: bodyHtml,
      header: { style: { 'background-color': '#383838', 'color': '#ffffff' } },
      buttons: [{
        text: '<i class="fa fa-times" style="margin-right:4px;"></i>Close',
        handler: function(btn) { btn.up('window').close(); }
      }],
      buttonAlign: 'right'
    }).show();
  }

  // ==========================================================================
  // 11. Export
  // ==========================================================================
  function exportGanttToExcel() {
    if (!isFeatureEnabled('excelDownload')) return false;
    if (!gantt || !gantt.exportToExcel) {
      EAM.Messaging.showConfirmation("Excel export is not available. Please verify the DHTMLX export API is loaded.");
      return;
    }

    try {
      gantt.exportToExcel({
        name: "IUXHUB_Gantt.xlsx",
        visual: "base-colors",
        cellColors: true,
        date_format: "dd-mm-yyyy",
        columns: getCleanExcelExportColumns()
      });
    } catch (e) {
      console.error("Unable to export Gantt to Excel.", e);
      EAM.Messaging.showConfirmation("Unable to export Gantt to Excel. Please try again.");
    }
  }

  function getCleanExcelExportColumns() {
    return (gantt.config.columns || []).filter(function(column) {
      return column && column.name !== "IUX_BULK_SELECT" && column.name !== "IUX_WO_INDICATOR";
    }).map(function(column, index) {
      var fieldName = String((column && (column.name || column.id)) || "");
      var headerText = cleanExportHeaderLabel((column && column.label) || fieldName);
      var exportColumn = {
        id: fieldName,
        header: headerText || getExportHeaderFallback(fieldName) || ("Column " + (index + 1)),
        width: parseInt((column && column.width) || 100, 10) || 100
      };

      if (column && column.dataType === "date") {
        exportColumn.type = "date";
      }

      return exportColumn;
    });
  }

  function cleanExportHeaderLabel(label) {
    var text = String(label || "");
    text = text.replace(/<div[^>]*data-text-filter[^>]*><\/div>/gi, "");
    text = text.replace(/<div[^>]*data-date-filter[^>]*><\/div>/gi, "");
    text = text.replace(/<[^>]+>/g, "");
    return text.replace(/\s+/g, " ").trim();
  }

  function getExportHeaderFallback(fieldName) {
    return String(fieldName || "")
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, function(match) { return match.toUpperCase(); });
  }

  // ==========================================================================
  // 12. Analytics and Resource Popups
  // ==========================================================================
  function showAnalyticsPopup() {
    if (!isFeatureEnabled('analytics')) return false;
    var selectedOrg = getSelectedAnalyticsOrganization();
    if (!selectedOrg) {
      EAM.Messaging.showConfirmation('Select one Organization before running Analytics. Analytics is not available for All Organizations or *.');
      return false;
    }
    var report = buildGanttAnalytics(selectedOrg);
    gGanttGlobal.AnalyticsCache = report;
    var html = renderAnalyticsHtml(report);
    var viewportSize = Ext.getBody().getViewSize();

    if (Ext.getCmp('ganttAnalyticsWin')) Ext.getCmp('ganttAnalyticsWin').destroy();

    var win = Ext.create('Ext.window.Window', {
      id: 'ganttAnalyticsWin',
      cls: 'iux-product-window',
      title: '<i class="fa fa-line-chart" style="margin-right:8px;"></i><b style="color:white;">Planning Analytics</b>',
      width: Math.max(980, Math.floor(viewportSize.width * 0.8)),
      height: Math.min(720, Math.floor(viewportSize.height * 0.86)),
      modal: true,
      bodyPadding: 0,
      scrollable: true,
      html: html,
      header: { style: { 'background-color': '#383838', 'color': '#ffffff' } },
      listeners: {
        afterrender: function(w) {
          var el = w.getEl().dom;
          el.addEventListener('click', function(e) {
            var infoTarget = e.target && e.target.getAttribute ? e.target.getAttribute('data-analytics-info') : '';
            if (!infoTarget && e.target && e.target.parentElement && e.target.parentElement.getAttribute) {
              infoTarget = e.target.parentElement.getAttribute('data-analytics-info');
            }
            if (infoTarget) showAnalyticsHelp(infoTarget);
            var tradeTarget = e.target;
            while (tradeTarget && tradeTarget !== el && !(tradeTarget.getAttribute && tradeTarget.getAttribute('data-analytics-trade'))) {
              tradeTarget = tradeTarget.parentElement;
            }
            if (tradeTarget && tradeTarget !== el) {
              showUnassignedTradeDateDistributionPopup(tradeTarget.getAttribute('data-analytics-trade'));
            }
          });
        }
      }
    });
    win.show();
  }

  function buildGanttAnalytics(selectedOrg) {
    selectedOrg = analyticsText(selectedOrg).toUpperCase();
    var workOrders = getAnalyticsWorkOrders(selectedOrg);
    var resources = getAnalyticsResources(selectedOrg);
    var unassignedByTradeDate = {};
    var assignedByTradeDate = {};
    var scheduledOnNonWorking = [];
    var missingInfo = [];
    var employeeScheduled = {};
    var totalHours = 0;
    var assignedHours = 0;
    var unassignedHours = 0;
    var assignedWorkOrders = 0;
    var unassignedWorkOrders = 0;
    var taskCount = 0;

    workOrders.forEach(function(wo) {
      var start = analyticsDate(wo.originalStart || wo.EVT_TARGET || wo.evt_target || wo.start_date);
      var end = analyticsDate(wo.originalEnd || wo.EVT_SCHEDEND || wo.evt_schedend || wo.end_date);
      if (!start) return;
      if (!end) end = new Date(start.getTime());
      if (end < start) end = new Date(start.getTime());

      var days = analyticsDaysBetween(start, end);
      var hours = analyticsNumber(wo.ACT_EST || wo.act_est);
      var perDay = days > 0 ? hours / days : hours;
      var person = analyticsText(wo.EVT_PERSON || wo.evt_person);
      var trades = analyticsTrades(wo.LISTOFTRADES || wo.listoftrades);
      var woCode = analyticsText(wo.EVT_CODE || wo.evt_code || wo.id);
      var shift = analyticsText(wo.EVT_SHIFT || wo.evt_shift || wo.SHIFT || wo.shift);
      var desc = analyticsText(wo.EVT_DESC || wo.evt_desc);
      var missingFields = [];
      var nonWorkingDates = [];

      taskCount++;
      totalHours += hours;
      if (person) {
        assignedWorkOrders++;
        assignedHours += hours;
      } else {
        unassignedWorkOrders++;
        unassignedHours += hours;
      }
      if (!trades.length) missingFields.push('Trade');
      if (hours <= 0) missingFields.push('Estimated Hours');
      if (!start) missingFields.push('Scheduled Start');
      if (!end) missingFields.push('Scheduled End');

      analyticsEachDay(start, end, function(day) {
        var dateKey = analyticsDateKey(day);
        if (day.getDay() === 0 || day.getDay() === 6) {
          nonWorkingDates.push(dateKey + ' Weekend');
        } else if (isUSHoliday(day)) {
          nonWorkingDates.push(dateKey + ' US Holiday');
        } else if (isOrganizationHoliday(day)) {
          nonWorkingDates.push(dateKey + ' Organization Holiday');
        } else if (isOrganizationSpecialDay(day)) {
          nonWorkingDates.push(dateKey + ' Organization Special Day');
        }

        if (!person) {
          var rowTrades = trades.length ? trades : ['NO TRADE'];
          var tradeShare = rowTrades.length ? perDay / rowTrades.length : perDay;
          rowTrades.forEach(function(trade) {
            var key = dateKey + '|' + trade;
            if (!unassignedByTradeDate[key]) {
              unassignedByTradeDate[key] = {
                date: dateKey,
                trade: trade,
                hours: 0,
                workOrders: {}
              };
            }
            unassignedByTradeDate[key].hours += tradeShare;
            unassignedByTradeDate[key].workOrders[woCode] = true;
          });
        } else {
          var assignedRowTrades = trades.length ? trades : ['NO TRADE'];
          var assignedTradeShare = assignedRowTrades.length ? perDay / assignedRowTrades.length : perDay;
          assignedRowTrades.forEach(function(trade) {
            var assignedTradeKey = dateKey + '|' + trade;
            if (!assignedByTradeDate[assignedTradeKey]) {
              assignedByTradeDate[assignedTradeKey] = {
                date: dateKey,
                trade: trade,
                hours: 0,
                workOrders: {}
              };
            }
            assignedByTradeDate[assignedTradeKey].hours += assignedTradeShare;
            assignedByTradeDate[assignedTradeKey].workOrders[woCode] = true;
          });

          var scheduledKey = dateKey + '|' + person;
          if (!employeeScheduled[scheduledKey]) {
            employeeScheduled[scheduledKey] = {
              date: dateKey,
              employee: person,
              shifts: {},
              trades: {},
              workOrders: {},
              hours: 0
            };
          }
          employeeScheduled[scheduledKey].hours += perDay;
          employeeScheduled[scheduledKey].workOrders[woCode] = true;
          if (shift) employeeScheduled[scheduledKey].shifts[shift] = true;
          (trades.length ? trades : ['NO TRADE']).forEach(function(trade) {
            employeeScheduled[scheduledKey].trades[trade] = true;
          });
        }
      });

      if (nonWorkingDates.length) {
        scheduledOnNonWorking.push({
          code: woCode,
          desc: desc,
          dates: nonWorkingDates.join(', '),
          hours: hours
        });
      }

      if (missingFields.length) {
        missingInfo.push({
          code: woCode,
          desc: desc,
          missing: missingFields.join(', '),
          hours: hours,
          trades: trades.join(', ') || '-'
        });
      }
    });

    var unassignedTradeRows = Object.keys(unassignedByTradeDate).map(function(key) {
      var row = unassignedByTradeDate[key];
      row.workOrderCount = Object.keys(row.workOrders).length;
      row.hourPct = analyticsPct(row.hours, unassignedHours);
      return row;
    }).sort(function(a, b) {
      return (a.date || '').localeCompare(b.date || '') || (a.trade || '').localeCompare(b.trade || '');
    });
    var unassignedByTrade = {};
    unassignedTradeRows.forEach(function(row) {
      if (!unassignedByTrade[row.trade]) {
        unassignedByTrade[row.trade] = {
          trade: row.trade,
          hours: 0,
          workOrders: {},
          dates: []
        };
      }
      unassignedByTrade[row.trade].hours += row.hours;
      Object.keys(row.workOrders || {}).forEach(function(woCode) {
        unassignedByTrade[row.trade].workOrders[woCode] = true;
      });
      unassignedByTrade[row.trade].dates.push(row);
    });
    var unassignedTradeSummary = Object.keys(unassignedByTrade).map(function(trade) {
      var row = unassignedByTrade[trade];
      row.workOrderCount = Object.keys(row.workOrders).length;
      row.hourPct = analyticsPct(row.hours, unassignedHours);
      return row;
    }).sort(function(a, b) {
      return b.hours - a.hours || (a.trade || '').localeCompare(b.trade || '');
    });

    var assignedTradeRows = Object.keys(assignedByTradeDate).map(function(key) {
      var row = assignedByTradeDate[key];
      row.workOrderCount = Object.keys(row.workOrders).length;
      row.hourPct = analyticsPct(row.hours, assignedHours);
      return row;
    }).sort(function(a, b) {
      return (a.date || '').localeCompare(b.date || '') || (a.trade || '').localeCompare(b.trade || '');
    });
    var assignedByTrade = {};
    assignedTradeRows.forEach(function(row) {
      if (!assignedByTrade[row.trade]) {
        assignedByTrade[row.trade] = {
          trade: row.trade,
          hours: 0,
          workOrders: {},
          dates: []
        };
      }
      assignedByTrade[row.trade].hours += row.hours;
      Object.keys(row.workOrders || {}).forEach(function(woCode) {
        assignedByTrade[row.trade].workOrders[woCode] = true;
      });
      assignedByTrade[row.trade].dates.push(row);
    });
    var assignedTradeSummary = Object.keys(assignedByTrade).map(function(trade) {
      var row = assignedByTrade[trade];
      row.workOrderCount = Object.keys(row.workOrders).length;
      row.hourPct = analyticsPct(row.hours, assignedHours);
      return row;
    }).sort(function(a, b) {
      return b.hours - a.hours || (a.trade || '').localeCompare(b.trade || '');
    });

    var overloadThreshold = getConfiguredExperience().resourceOverloadThresholdHours || 8;
    var overScheduledRows = Object.keys(employeeScheduled).map(function(key) {
      var row = employeeScheduled[key];
      row.shiftList = Object.keys(row.shifts).sort().join(', ') || '-';
      row.tradeList = Object.keys(row.trades).sort().join(', ') || '-';
      row.workOrderCount = Object.keys(row.workOrders).length;
      row.overThreshold = row.hours - overloadThreshold;
      return row;
    }).filter(function(row) {
      return row.hours > overloadThreshold;
    }).sort(function(a, b) {
      return (a.date || '').localeCompare(b.date || '') || b.hours - a.hours;
    });

    return {
      generatedAt: new Date(),
      selectedOrg: selectedOrg,
      workOrderCount: taskCount,
      resourceCount: resources.length,
      totalHours: totalHours,
      assignedHours: assignedHours,
      unassignedHours: unassignedHours,
      assignedWorkOrders: assignedWorkOrders,
      unassignedWorkOrders: unassignedWorkOrders,
      assignedHoursPct: analyticsPct(assignedHours, totalHours),
      unassignedHoursPct: analyticsPct(unassignedHours, totalHours),
      assignedWorkOrdersPct: analyticsPct(assignedWorkOrders, taskCount),
      unassignedWorkOrdersPct: analyticsPct(unassignedWorkOrders, taskCount),
      nonWorkingCount: scheduledOnNonWorking.length,
      nonWorkingPct: analyticsPct(scheduledOnNonWorking.length, taskCount),
      missingInfoCount: missingInfo.length,
      missingInfoPct: analyticsPct(missingInfo.length, taskCount),
      overloadThreshold: overloadThreshold,
      overScheduledCount: overScheduledRows.length,
      unassignedByTradeDate: unassignedTradeRows,
      unassignedTradeSummary: unassignedTradeSummary,
      assignedByTradeDate: assignedTradeRows,
      assignedTradeSummary: assignedTradeSummary,
      scheduledOnNonWorking: scheduledOnNonWorking.sort(function(a, b) { return a.code.localeCompare(b.code); }),
      missingInfo: missingInfo.sort(function(a, b) { return a.code.localeCompare(b.code); }),
      overScheduledRows: overScheduledRows
    };
  }

  function getSelectedAnalyticsOrganization() {
    var orgCmp = Ext.getCmp('organization');
    var value = orgCmp && orgCmp.getValue ? orgCmp.getValue() : '';
    value = analyticsText(value).toUpperCase();
    if (!value || value === 'ALL' || value === '*') return '';
    return value;
  }

  function getAnalyticsWorkOrders(selectedOrg) {
    var tasks = [];
    try {
      if (typeof gantt !== 'undefined' && gantt.getTaskCount && gantt.getTaskCount() > 0) {
        gantt.eachTask(function(task) {
          tasks.push(task);
        });
      }
    } catch (e) {}
    tasks = tasks.length ? tasks : (gGanttGlobal.WorkOrderData || []);
    if (!selectedOrg) return tasks;
    selectedOrg = analyticsText(selectedOrg).toUpperCase();
    return tasks.filter(function(task) {
      return analyticsText(task.EVT_ORG || task.evt_org).toUpperCase() === selectedOrg;
    });
  }

  function getAnalyticsResources(selectedOrg) {
    var resources = gGanttGlobal.ResourceData || [];
    if (!selectedOrg) return resources;
    selectedOrg = analyticsText(selectedOrg).toUpperCase();
    return resources.filter(function(resource) {
      return analyticsText(resource.ORGANIZATION || resource.organization || resource.ORG || resource.org).toUpperCase() === selectedOrg;
    });
  }

  function renderAnalyticsHtml(report) {
    var maxRows = 12;
    var html = '<div class="iux-analytics">';
    html += '<div class="iux-analytics-header"><div><div class="iux-analytics-title">Planning Analytics</div><div class="iux-analytics-subtitle">Organization ' + analyticsEscape(report.selectedOrg || '-') + ' - assignment coverage, missing planning data, non-working-day scheduling, and resource availability exceptions.</div></div></div>';
    html += '<div class="iux-analytics-kpis">';
    html += analyticsKpi('Total Work Orders', report.workOrderCount, 'Loaded scheduled work orders', 'kpi_total_work_orders');
    html += analyticsKpi('Assigned Hours', analyticsHours(report.assignedHours) + 'h', report.assignedHoursPct + '% of total estimated hours', 'kpi_assigned_hours');
    html += analyticsKpi('Unassigned Hours', analyticsHours(report.unassignedHours) + 'h', report.unassignedHoursPct + '% of total estimated hours', 'kpi_unassigned_hours');
    html += analyticsKpi('Assigned WOs', report.assignedWorkOrders, report.assignedWorkOrdersPct + '% of work orders', 'kpi_assigned_work_orders');
    html += analyticsKpi('Unassigned WOs', report.unassignedWorkOrders, report.unassignedWorkOrdersPct + '% of work orders', 'kpi_unassigned_work_orders');
    html += analyticsKpi('Holiday / Weekend WOs', report.nonWorkingCount, report.nonWorkingPct + '% of work orders', 'kpi_non_working_work_orders');
    html += analyticsKpi('Missing Info', report.missingInfoCount, report.missingInfoPct + '% missing trade or estimate', 'kpi_missing_info');
    html += '</div>';

    html += '<div class="iux-analytics-grid">';
    html += analyticsSection('Unassigned Employee Hours / Work Orders by Trade', 'unassigned_by_trade', renderUnassignedTradeSummaryTable(report.unassignedTradeSummary.slice(0, maxRows)), report.unassignedTradeSummary.length ? 'Click a trade row to view date distribution.' : 'No unassigned employee hours found.');
    html += analyticsSection('Assigned Employee Hours / Work Orders by Trade', 'assigned_by_trade', renderAssignedTradeSummaryTable(report.assignedTradeSummary.slice(0, maxRows)), report.assignedTradeSummary.length ? 'Assigned employee hours grouped by trade.' : 'No assigned employee hours found.');

    html += analyticsSection('Work Orders with Missing Information', 'missing_info_work_orders', analyticsTable('missing_info_work_orders', ['WO', 'Missing', 'Trade', 'Est. Hours', 'Description'], report.missingInfo.slice(0, maxRows).map(function(r) {
      return [r.code, r.missing, r.trades, analyticsHours(r.hours) + 'h', r.desc];
    })), report.missingInfo.length ? report.missingInfoCount + ' work order(s), ' + report.missingInfoPct + '% of total, need data cleanup.' : 'No missing trade or estimated hour issues found.');

    html += analyticsSection('Employees Scheduled Over Threshold per Day', 'employee_scheduled_over_8', analyticsTable('employee_scheduled_over_8', ['Date', 'Employee', 'Assigned Hours', 'Over Threshold', 'Assigned WOs', 'Shift', 'Trade'], report.overScheduledRows.slice(0, maxRows).map(function(r) {
      return [r.date, r.employee, analyticsHours(r.hours) + 'h', analyticsHours(r.overThreshold) + 'h', r.workOrderCount, r.shiftList, r.tradeList];
    })), report.overScheduledRows.length ? report.overScheduledCount + ' employee/day row(s) are scheduled above ' + analyticsHours(report.overloadThreshold) + ' hours.' : 'No employee is scheduled above ' + analyticsHours(report.overloadThreshold) + ' hours per day.');
    html += '</div>';

    html += '<div class="iux-analytics-footnote">Total estimated hours: <b>' + analyticsHours(report.totalHours) + 'h</b>. Resource rows loaded: <b>' + report.resourceCount + '</b>. Use Refresh after changing toolbar filters to recalculate.</div>';
    html += '</div>';
    return html;
  }

  function analyticsKpi(label, value, help, helpKey) {
    return '<div class="iux-analytics-kpi"><span>' + analyticsEscape(label) + analyticsInfoButton(helpKey) + '</span><strong>' + analyticsEscape(value) + '</strong><em>' + analyticsEscape(help) + '</em></div>';
  }

  function analyticsSection(title, helpKey, table, emptyText) {
    var hasTable = !!table;
    return '<div class="iux-analytics-card"><div class="iux-analytics-card-title">' + analyticsEscape(title) + analyticsInfoButton(helpKey) + '</div>' +
      (hasTable ? table + '<div class="iux-analytics-note">' + analyticsEscape(emptyText) + '</div>' : '<div class="iux-analytics-empty">' + analyticsEscape(emptyText) + '</div>') +
      '</div>';
  }

  function renderUnassignedTradeSummaryTable(rows) {
    if (!rows || rows.length === 0) return '';
    var html = '<table class="iux-analytics-table iux-analytics-click-table"><thead><tr>' +
      '<th>Trade' + analyticsInfoButton('unassigned_by_trade.Trade') + '</th>' +
      '<th>Unassigned Hours' + analyticsInfoButton('unassigned_by_trade.Unassigned Hours') + '</th>' +
      '<th>Unassigned WOs' + analyticsInfoButton('unassigned_by_trade.Unassigned WOs') + '</th>' +
      '<th>% Unassigned Hours' + analyticsInfoButton('unassigned_by_trade.% Unassigned Hours') + '</th>' +
    '</tr></thead><tbody>';
    rows.forEach(function(row) {
      html += '<tr class="iux-analytics-click-row" data-analytics-trade="' + analyticsEscape(row.trade) + '">' +
        '<td><strong>' + analyticsEscape(row.trade) + '</strong></td>' +
        '<td>' + analyticsEscape(analyticsHours(row.hours) + 'h') + '</td>' +
        '<td>' + analyticsEscape(row.workOrderCount) + '</td>' +
        '<td>' + analyticsEscape(row.hourPct + '%') + '</td>' +
      '</tr>';
    });
    html += '</tbody></table>';
    return html;
  }

  function renderAssignedTradeSummaryTable(rows) {
    if (!rows || rows.length === 0) return '';
    var html = '<table class="iux-analytics-table"><thead><tr>' +
      '<th>Trade' + analyticsInfoButton('assigned_by_trade.Trade') + '</th>' +
      '<th>Assigned Hours' + analyticsInfoButton('assigned_by_trade.Assigned Hours') + '</th>' +
      '<th>Assigned WOs' + analyticsInfoButton('assigned_by_trade.Assigned WOs') + '</th>' +
      '<th>% Assigned Hours' + analyticsInfoButton('assigned_by_trade.% Assigned Hours') + '</th>' +
    '</tr></thead><tbody>';
    rows.forEach(function(row) {
      html += '<tr>' +
        '<td><strong>' + analyticsEscape(row.trade) + '</strong></td>' +
        '<td>' + analyticsEscape(analyticsHours(row.hours) + 'h') + '</td>' +
        '<td>' + analyticsEscape(row.workOrderCount) + '</td>' +
        '<td>' + analyticsEscape(row.hourPct + '%') + '</td>' +
      '</tr>';
    });
    html += '</tbody></table>';
    return html;
  }

  function analyticsTable(sectionKey, headers, rows) {
    if (!rows || rows.length === 0) return '';
    var html = '<table class="iux-analytics-table"><thead><tr>';
    headers.forEach(function(h) { html += '<th>' + analyticsEscape(h) + analyticsInfoButton(sectionKey + '.' + h) + '</th>'; });
    html += '</tr></thead><tbody>';
    rows.forEach(function(row) {
      html += '<tr>';
      row.forEach(function(cell) { html += '<td>' + analyticsEscape(cell) + '</td>'; });
      html += '</tr>';
    });
    html += '</tbody></table>';
    return html;
  }

  function showUnassignedTradeDateDistributionPopup(trade) {
    var selectedOrg = getSelectedAnalyticsOrganization();
    if (!selectedOrg) {
      EAM.Messaging.showConfirmation('Select one Organization before running Analytics. Analytics is not available for All Organizations or *.');
      return false;
    }
    var report = gGanttGlobal.AnalyticsCache;
    if (!report || analyticsText(report.selectedOrg).toUpperCase() !== selectedOrg) {
      report = buildGanttAnalytics(selectedOrg);
      gGanttGlobal.AnalyticsCache = report;
    }
    var rows = (report.unassignedByTradeDate || []).filter(function(row) {
      return row.trade === trade;
    }).sort(function(a, b) {
      return (a.date || '').localeCompare(b.date || '');
    });
    var totalTradeHours = rows.reduce(function(total, row) {
      return total + analyticsNumber(row.hours);
    }, 0);
    var table = analyticsTable('unassigned_trade_date_distribution', ['Date', 'Unassigned Hours', 'Unassigned WOs', '% Unassigned Hours'], rows.map(function(row) {
      return [row.date, analyticsHours(row.hours) + 'h', row.workOrderCount, analyticsPct(row.hours, totalTradeHours) + '%'];
    }));
    var html = '<div class="iux-analytics">' +
      '<div class="iux-analytics-header"><div><div class="iux-analytics-title">' + analyticsEscape(trade) + ' - Date Distribution</div>' +
      '<div class="iux-analytics-subtitle">Unassigned employee hours and work orders by scheduled date for the selected trade.</div></div></div>' +
      '<div class="iux-analytics-card">' + (table || '<div class="iux-analytics-empty">No date distribution found for this trade.</div>') + '</div>' +
    '</div>';

    if (Ext.getCmp('ganttAnalyticsTradeWin')) Ext.getCmp('ganttAnalyticsTradeWin').destroy();
    Ext.create('Ext.window.Window', {
      id: 'ganttAnalyticsTradeWin',
      cls: 'iux-product-window',
      title: '<i class="fa fa-table" style="margin-right:8px;"></i><b style="color:white;">Unassigned Trade Date Distribution</b>',
      width: 620,
      height: 460,
      modal: true,
      bodyPadding: 0,
      scrollable: true,
      html: html,
      header: { style: { 'background-color': '#383838', 'color': '#ffffff' } },
      buttons: [{
        text: 'Close',
        handler: function(btn) { btn.up('window').close(); }
      }]
    }).show();
  }

  function analyticsInfoButton(helpKey) {
    return '<button type="button" class="iux-analytics-info" data-analytics-info="' + analyticsEscape(helpKey) + '" title="How this is calculated">i</button>';
  }

  function showAnalyticsHelp(helpKey) {
    var help = getAnalyticsHelpText(helpKey);
    Ext.Msg.show({
      title: help.title,
      message: help.body,
      buttons: Ext.Msg.OK,
      icon: Ext.Msg.INFO
    });
  }

  function getAnalyticsHelpText(helpKey) {
    var help = {
      kpi_total_work_orders: {
        title: 'Total Work Orders',
        body: 'Count of work order rows currently loaded into the Gantt.'
      },
      kpi_assigned_hours: {
        title: 'Assigned Hours',
        body: 'Sum of ACT_EST for work orders where EVT_PERSON is populated.'
      },
      kpi_unassigned_hours: {
        title: 'Unassigned Hours',
        body: 'Sum of ACT_EST for work orders where EVT_PERSON is blank.'
      },
      kpi_assigned_work_orders: {
        title: 'Assigned Work Orders',
        body: 'Count of work orders where EVT_PERSON is populated.'
      },
      kpi_unassigned_work_orders: {
        title: 'Unassigned Work Orders',
        body: 'Count of work orders where EVT_PERSON is blank.'
      },
      kpi_non_working_work_orders: {
        title: 'Holiday / Weekend Work Orders',
        body: 'Count of work orders whose scheduled date range touches a weekend or configured holiday.'
      },
      kpi_missing_info: {
        title: 'Missing Information',
        body: 'Count of work orders missing trade or estimated hours.'
      },
      unassigned_by_trade: {
        title: 'Unassigned by Trade',
        body: 'Unassigned ACT_EST is grouped by trade. Click a trade row to see its date distribution.'
      },
      assigned_by_trade: {
        title: 'Assigned by Trade',
        body: 'Assigned ACT_EST is grouped by trade for work orders where EVT_PERSON is populated.'
      },
      missing_info_work_orders: {
        title: 'Missing Information',
        body: 'Lists work orders missing LISTOFTRADES or ACT_EST.'
      },
      employee_scheduled_over_8: {
        title: 'Employees Scheduled Above Threshold',
        body: 'Lists employee/date rows where assigned work order ACT_EST exceeds the configured resource overload threshold.'
      }
    };

    var columns = {
      'unassigned_by_trade.Trade': 'LISTOFTRADES value. Multiple trades split estimated hours evenly.',
      'unassigned_by_trade.Unassigned Hours': 'Total unassigned ACT_EST for this trade.',
      'unassigned_by_trade.Unassigned WOs': 'Number of unassigned work orders contributing to this trade.',
      'unassigned_by_trade.% Unassigned Hours': 'Percent of total unassigned hours represented by this trade.',
      'unassigned_trade_date_distribution.Date': 'Scheduled date receiving unassigned estimated hours for the selected trade.',
      'unassigned_trade_date_distribution.Unassigned Hours': 'Unassigned ACT_EST allocated to this date for the selected trade.',
      'unassigned_trade_date_distribution.Unassigned WOs': 'Number of unassigned work orders contributing to this date for the selected trade.',
      'unassigned_trade_date_distribution.% Unassigned Hours': 'Percent of selected trade unassigned hours represented by this date.',
      'assigned_by_trade.Trade': 'LISTOFTRADES value. Multiple trades split estimated hours evenly.',
      'assigned_by_trade.Assigned Hours': 'Total assigned ACT_EST for this trade.',
      'assigned_by_trade.Assigned WOs': 'Number of assigned work orders contributing to this trade.',
      'assigned_by_trade.% Assigned Hours': 'Percent of total assigned hours represented by this trade.',
      'missing_info_work_orders.Missing': 'Planning fields missing from the work order.',
      'employee_scheduled_over_8.Assigned Hours': 'Total assigned ACT_EST for the employee on the scheduled date.',
      'employee_scheduled_over_8.Over Threshold': 'Assigned hours minus the configured resource overload threshold.',
      'employee_scheduled_over_8.Assigned WOs': 'Number of assigned work orders contributing scheduled hours on this date.'
    };

    if (columns[helpKey]) {
      return { title: 'Column: ' + helpKey.split('.').pop(), body: columns[helpKey] };
    }
    return help[helpKey] || { title: 'Analytics Help', body: 'This value is calculated from the current work order and resource data loaded in the Gantt.' };
  }

  function analyticsDate(value) {
    if (!value) return null;
    if (value instanceof Date) return new Date(value.getFullYear(), value.getMonth(), value.getDate());
    var text = String(value);
    var d;
    if (/^\d{2}-\d{2}-\d{4}$/.test(text)) {
      var parts = text.split('-');
      d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    } else {
      d = new Date(text);
    }
    if (isNaN(d.getTime())) return null;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  function analyticsDateKey(value) {
    var d = analyticsDate(value);
    if (!d) return '';
    var m = d.getMonth() + 1;
    var day = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' + m : m) + '-' + (day < 10 ? '0' + day : day);
  }

  function analyticsDaysBetween(start, end) {
    var oneDay = 24 * 60 * 60 * 1000;
    return Math.max(1, Math.floor((end - start) / oneDay) + 1);
  }

  function analyticsEachDay(start, end, fn) {
    var cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    var last = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    while (cursor <= last) {
      fn(new Date(cursor.getTime()));
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  function analyticsTrades(value) {
    if (!value || value === '*') return [];
    var seen = {};
    return String(value).split(',').map(function(t) {
      return analyticsText(t);
    }).filter(function(t) {
      if (!t || seen[t]) return false;
      seen[t] = true;
      return true;
    });
  }

  function analyticsText(value) {
    if (value === null || value === undefined) return '';
    return String(value).trim();
  }

  function analyticsNumber(value) {
    var n = parseFloat(value);
    return isNaN(n) ? 0 : n;
  }

  function analyticsAdd(map, key, value) {
    map[key] = (map[key] || 0) + analyticsNumber(value);
  }

  function analyticsSum(map) {
    return Object.keys(map || {}).reduce(function(total, key) {
      return total + analyticsNumber(map[key]);
    }, 0);
  }

  function analyticsCapacityForDate(resources, dateKey) {
    var total = 0;
    (resources || []).forEach(function(resource) {
      if (resource.date === dateKey) total += analyticsNumber(resource.hours);
    });
    return total;
  }

  function analyticsOrgMatches(resourceOrg, workOrderOrg) {
    resourceOrg = analyticsText(resourceOrg || '*');
    workOrderOrg = analyticsText(workOrderOrg || '*');
    return resourceOrg === '*' || workOrderOrg === '*' || resourceOrg === workOrderOrg;
  }

  function analyticsEmployeeCapacityFor(resources, dateKey, employee, org) {
    var total = 0;
    (resources || []).forEach(function(resource) {
      if (resource.date === dateKey &&
          resource.employee === employee &&
          analyticsOrgMatches(resource.org, org)) {
        total += analyticsNumber(resource.hours);
      }
    });
    return total;
  }

  function analyticsTradeCapacityFor(resources, dateKey, trade, org) {
    var total = 0;
    (resources || []).forEach(function(resource) {
      if (resource.date === dateKey &&
          resource.trade === trade &&
          analyticsOrgMatches(resource.org, org)) {
        total += analyticsNumber(resource.hours);
      }
    });
    return total;
  }

  function analyticsAssignedEmployeeCapacity(employeeDemand, resources) {
    var total = 0;
    Object.keys(employeeDemand || {}).forEach(function(key) {
      var parts = key.split('|');
      total += analyticsEmployeeCapacityFor(resources, parts[0], parts[1], parts[2]);
    });
    return total;
  }

  function analyticsPct(numerator, denominator) {
    if (!denominator) return numerator ? 100 : 0;
    return Math.round((numerator / denominator) * 100);
  }

  function analyticsHours(value) {
    var n = analyticsNumber(value);
    return (Math.round(n * 10) / 10).toString();
  }

  function analyticsEscape(value) {
    return String(value === null || value === undefined ? '' : value).replace(/[&<>"']/g, function(ch) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
    });
  }

  // ==========================================================================
  // 13. Summary and Filtering
  // ==========================================================================
  // Show a summary popup and allow filtering by group
  function showSummaryPopup() {
    if (!isFeatureEnabled('summary')) return false;
    // Collect counts
    var counts = {
      byType: {},
      byDepartment: {},
      byStatus: { },
      byDueExceeded: { Exceeded: 0, NotExceeded: 0 }
    };

    gantt.eachTask(function(task) {
      // Skip if no real task
      if (!task) return;

      // Type
      var t = task.EVT_JOBTYPE || 'UNKNOWN';
      counts.byType[t] = (counts.byType[t] || 0) + 1;

      // Department (MRC)
      var d = task.EVT_MRC || task.EVT_ORG || 'UNKNOWN';
      counts.byDepartment[d] = (counts.byDepartment[d] || 0) + 1;

      // Status
      var s = task.EVT_STATUS || 'UNKNOWN';
      counts.byStatus[s] = (counts.byStatus[s] || 0) + 1;

      if (isDueDateExceeded(task)) counts.byDueExceeded.Exceeded++;
      else counts.byDueExceeded.NotExceeded++;
    });

    // Helper to lookup descriptions from stores
    function lookupDescription(typeKey, code) {
      var store = null;
      if (typeKey === 'TYPE') store = gGanttGlobal.WorkorderTypeStore;
      else if (typeKey === 'DEPARTMENT') store = gGanttGlobal.DepartmentStore;
      else if (typeKey === 'STATUS') store = gGanttGlobal.WorkorderStatusStore;
      if (!store) return code;
      try {
        var idx = store.findExact ? store.findExact('code', code) : -1;
        if (idx !== -1) return code + ' - ' + store.getAt(idx).get('description');
      } catch (e) {
        // fallback
      }
      return code;
    }

    // Build HTML for popup (shows code and description where available)
    function renderSection(title, obj, typeKey) {
      var html = '<div style="background:#ffffff;border-radius:16px;padding:16px;border:1px solid #e5e7eb;box-shadow:0 18px 60px rgba(15,23,42,0.08);">';
      html += '<div style="font-size:14px;font-weight:700;color:#111827;margin-bottom:14px;">' + title + '</div>';
      html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;">';
      Object.keys(obj).sort().forEach(function(k) {
        var display = (typeKey === 'DUEDATE') ? k : lookupDescription(typeKey, k);
        // Inline onclick uses a global helper to ensure it fires correctly inside Ext window
        html += '<div class="summary-item" onclick="window.applySummaryFilterFromPopup(\'' + typeKey + '\',\'' + encodeURIComponent(k) + '\')" data-type="' + typeKey + '" data-key="' + k + '" style="padding:14px 12px;border-radius:14px;cursor:pointer;background:#f9fafb;border:1px solid #e5e7eb;display:flex;align-items:center;justify-content:space-between;transition:transform 0.15s ease,border-color 0.15s ease;">' +
                '<div style="font-size:13px;line-height:1.4;color:#111827;font-weight:600;">' + display + '</div>' +
                '<div style="font-size:14px;font-weight:700;color:#0f172a;background:#e0f2fe;padding:8px 12px;border-radius:999px;white-space:nowrap;">' + obj[k] + '</div></div>';
      });
      html += '</div></div>';
      return html;
    }

    var html = '<div style="font-family:Arial, sans-serif;background:#f4f6f8;padding:18px;">';
    html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;flex-wrap:wrap;gap:12px;">';
    html += '<div><div style="font-size:18px;font-weight:700;color:#1f2937;margin-bottom:6px;">Work Order Summary</div><div style="color:#4b5563;font-size:13px;max-width:420px;">Quickly filter the Gantt by type, department, status, or due date group. Click any card to apply the filter.</div></div>';
    html += '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;">';
    html += '<button id="clearSummaryFilterBtn" style="padding:8px 12px;border-radius:8px;border:1px solid #d1d5db;background:#ffffff;color:#111827;font-weight:600;cursor:pointer;">Clear Filter</button>';
    html += '<button id="showAllWorkOrdersBtn" style="padding:8px 12px;border-radius:8px;border:1px solid #0066cc;background:#0066cc;color:#ffffff;font-weight:600;cursor:pointer;">Show All WOs</button>';
    html += '<button id="closeSummaryBtn" style="padding:8px 12px;border-radius:8px;border:1px solid #0f172a;background:#0f172a;color:#ffffff;font-weight:600;cursor:pointer;">Close</button>';
    html += '</div></div>';
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px;margin-bottom:20px;">';
    html += renderSection('Work Order Type Summary', counts.byType, 'TYPE');
    html += renderSection('Grouped by Department', counts.byDepartment, 'DEPARTMENT');
    html += renderSection('Grouped by Status', counts.byStatus, 'STATUS');
    html += renderSection('Grouped by Due Date', counts.byDueExceeded, 'DUEDATE');
    html += '</div>';
    html += '</div>';

    if (Ext.getCmp('ganttSummaryWin')) Ext.getCmp('ganttSummaryWin').destroy();
    var win = Ext.create('Ext.window.Window', {
      id: 'ganttSummaryWin',
      cls: 'iux-product-window',
      title: '<i class="fa fa-chart-pie" style="margin-right:8px;"></i><b style="color:white;">Work Order Summary</b>',
      width: 520,
      height: 560,
      modal: true,
      bodyPadding: 0,
      scrollable: true,
      html: html,
      header: { style: { 'background-color': '#383838', 'color': '#ffffff' } },
      listeners: {
        afterrender: function(w) {
          // Expose a safe global helper for the inline onclick handlers
          window.applySummaryFilterFromPopup = function(type, encodedKey) {
            try { encodedKey = decodeURIComponent(encodedKey); } catch(e) {}
            applySummaryFilter(type, encodedKey);
            // keep the popup open to allow multiple selections — comment next line if you want it to stay
            if (Ext.getCmp('ganttSummaryWin')) Ext.getCmp('ganttSummaryWin').close();
          };
          // Attach handlers for the control buttons
          var el = w.getEl().dom;
          el.addEventListener('click', function(e) {
            if (e.target && e.target.id === 'closeSummaryBtn') w.close();
            if (e.target && e.target.id === 'clearSummaryFilterBtn') clearSummaryFilter();
            if (e.target && e.target.id === 'showAllWorkOrdersBtn') renderAllWorkOrders();
          });
        },
        destroy: function() {
          try { delete window.applySummaryFilterFromPopup; } catch(e) {}
        }
      }
    });
    win.show();
  }

  function applySummaryFilter(type, key) {
    if (!isFeatureEnabled('summary')) return false;
    // type: TYPE, DEPARTMENT, STATUS, DUEDATE
    gGanttGlobal.activeSummaryFilter = { type: type, key: key };
    gantt.eachTask(function(task) {
      var visible = true;
      if (type === 'TYPE') {
        visible = ((task.EVT_JOBTYPE || 'UNKNOWN') === key);
      } else if (type === 'DEPARTMENT') {
        visible = ((task.EVT_MRC || task.EVT_ORG || 'UNKNOWN') === key);
      } else if (type === 'STATUS') {
        visible = ((task.EVT_STATUS || 'UNKNOWN') === key);
      } else if (type === 'DUEDATE') {
        visible = (key === 'Exceeded') ? isDueDateExceeded(task) : !isDueDateExceeded(task);
      }
      task._summaryVisible = visible;
    });
    gantt.render();
    updateSummaryFilterIndicator();
    updateHeader();
  }

  function clearSummaryFilter() {
    delete gGanttGlobal.activeSummaryFilter;
    gantt.eachTask(function(task) { task._summaryVisible = true; });
    gantt.render();
    updateSummaryFilterIndicator();
    updateHeader();
  }

  function renderAllWorkOrders() {
    delete gGanttGlobal.activeSummaryFilter;

    var searchCmp = Ext.getCmp('searchgantt');
    if (searchCmp) {
      if (searchCmp.suspendEvents) searchCmp.suspendEvents(false);
      searchCmp.setValue('');
      if (searchCmp.resumeEvents) searchCmp.resumeEvents();
    }

    document.querySelectorAll('input[data-text-filter], input[data-date-filter]').forEach(function(input) {
      input.value = '';
    });

    if (typeof filterManager !== 'undefined' && filterManager && filterManager.filters) {
      filterManager.filters.forEach(function(filter) {
        filter.value = '';
      });
    }

    gantt.eachTask(function(task) {
      task._summaryVisible = true;
      task._columnVisible = true;
    });

    gantt.render();
    updateSummaryFilterIndicator();
    updateHeader();
  }

  function setToolbarComboValue(id, value) {
    var cmp = Ext.getCmp(id);
    if (!cmp) return;
    if (cmp.suspendEvents) cmp.suspendEvents(false);
    cmp.setValue(value);
    if (cmp.resumeEvents) cmp.resumeEvents();
  }

  function resetAllGanttFilters() {
    setToolbarComboValue('workorderstatus', 'ALL');
    setToolbarComboValue('workordertype', 'ALL');
    setToolbarComboValue('department', 'ALL');
    setToolbarComboValue('organization', 'ALL');
    setToolbarComboValue('dataspycomp', '');

    var searchCmp = Ext.getCmp('searchgantt');
    if (searchCmp) {
      if (searchCmp.suspendEvents) searchCmp.suspendEvents(false);
      searchCmp.setValue('');
      if (searchCmp.resumeEvents) searchCmp.resumeEvents();
    }

    renderAllWorkOrders();

    var reloadButton = Ext.getCmp("reloadGanttNow");
    if (reloadButton) reloadButton.addCls('highlight-button');
    EAM.Messaging.showConfirmation('Filters reset. Click Refresh to reload using the cleared toolbar filters.');
  }

  function encodeSummaryLabel(value) {
    return String(value || '').replace(/[&<>"']/g, function(ch) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
    });
  }

  function getSummaryFilterLabel(filter) {
    if (!filter) return '';
    var typeLabels = {
      TYPE: 'Type',
      DEPARTMENT: 'Department',
      STATUS: 'Status',
      DUEDATE: 'Due Date'
    };
    return (typeLabels[filter.type] || filter.type) + ': ' + filter.key;
  }

  function updateSummaryFilterIndicator() {
    var indicator = Ext.getCmp('summaryFilterIndicator');
    var summaryButton = Ext.getCmp('summaryButton');
    var defaultSummaryText = '<i class="fa fa-chart-pie" style="margin-right:6px;"></i>Summary';

    if (!isFeatureEnabled('summary')) {
      if (indicator) indicator.hide();
      if (summaryButton) {
        summaryButton.removeCls('iux-summary-active-button');
        summaryButton.setText(defaultSummaryText);
        summaryButton.setTooltip('Show work order summary');
      }
      return;
    }

    if (gGanttGlobal.activeSummaryFilter) {
      var label = getSummaryFilterLabel(gGanttGlobal.activeSummaryFilter);
      var safeLabel = encodeSummaryLabel(label);
      if (summaryButton) {
        summaryButton.addCls('iux-summary-active-button');
        summaryButton.setText('<i class="fa fa-filter" style="margin-right:6px;"></i>Summary Active: ' + safeLabel);
        summaryButton.setTooltip('Summary filter active: ' + label + '. Click to change the summary filter.');
      }
      if (indicator) {
        indicator.setText('<i class="fa fa-times" style="margin-right:5px;"></i>Clear Summary: ' + safeLabel);
        indicator.show();
      }
    } else {
      if (summaryButton) {
        summaryButton.removeCls('iux-summary-active-button');
        summaryButton.setText(defaultSummaryText);
        summaryButton.setTooltip('Show work order summary');
      }
      if (indicator) indicator.hide();
    }
  }

  function applyColumnFilters() {
    // Get all active filter inputs
    var textFilterInputs = document.querySelectorAll('input[data-text-filter]');
    var dateFilterInputs = document.querySelectorAll('input[data-date-filter]');
    
    // First, apply filters to filterManager if it exists
    var allInputs = document.querySelectorAll('input[data-text-filter], input[data-date-filter]');
    allInputs.forEach(function(inp) {
        var colName = inp.getAttribute(
            inp.hasAttribute('data-text-filter') 
                ? 'data-text-filter' 
                : 'data-date-filter'
        );
        
        if (!colName || !filterManager || !filterManager.filters) return;
        
        // Find and update the corresponding filter in filterManager
        for (var i = 0; i < filterManager.filters.length; i++) {
            if (filterManager.filters[i].columnName === colName) {
                // Update the filter's value directly
                filterManager.filters[i].value = inp.value;
                break;
            }
        }
    });
    
    // Now manually check each task and hide/show based on filter criteria
    gantt.eachTask(function(task) {
        var shouldDisplay = true;
        
        // Check text filters
        textFilterInputs.forEach(function(input) {
            var filterValue = input.value.trim();
            if (filterValue !== '') {
                var columnName = input.getAttribute('data-text-filter');
                var taskValue = task[columnName] || '';
                if (typeof taskValue !== 'string') {
                    taskValue = String(taskValue);
                }
                if (!taskValue.toLowerCase().includes(filterValue.toLowerCase())) {
                    shouldDisplay = false;
                }
            }
        });
        
        // Check date filters
        dateFilterInputs.forEach(function(input) {
            var filterValue = input.value.trim();
            if (filterValue !== '') {
                var columnName = input.getAttribute('data-date-filter');
                var taskValue = task[columnName];
                if (taskValue) {
                    var taskDateStr = '';
                    if (taskValue instanceof Date) {
                        taskDateStr = taskValue.toLocaleDateString();
                    } else {
                        taskDateStr = String(taskValue);
                    }
                    if (!taskDateStr.toLowerCase().includes(filterValue.toLowerCase())) {
                        shouldDisplay = false;
                    }
                } else {
                    shouldDisplay = false;
                }
            }
        });
        
        // Hide or show task based on filter results
        task._columnVisible = shouldDisplay;
    });
    
    // Render the gantt chart to apply the visibility changes
    gantt.render();
  }

  // ==========================================================================
  // 14. Header
  // ==========================================================================
  function updateHeader() {
    var headerMetrics = getHeaderWorkOrderMetrics();
    var totalWorkOrders = headerMetrics.count;
    var totalEstimatedHours = analyticsHours(headerMetrics.estimatedHours);
    var analyticsActionHtml = isFeatureEnabled('analytics')
      ? "<button type='button' id='iuxHeaderAnalytics' class='iux-header-action'><i class='fa fa-line-chart'></i> Analytics</button>"
      : "";

var vHeaderText =
"<div class='iux-header-shell'>" +
  "<div class='iux-header-brand'>" +
    "<span class='iux-header-logo'><img src='https://www.itxpertshub.com/assets/img/logo-orange-dark.png'/></span>" +
    "<span class='iux-header-title'><i class='fa fa-calendar-check'></i>Smart Scheduler</span>" +
  "</div>" +
  "<div class='iux-header-content'>" +
    "<div class='iux-header-actions'>" +
      analyticsActionHtml +
      "<button type='button' id='iuxHeaderConfig' class='iux-header-action'><i class='fa fa-cog'></i> Configuration</button>" +
      "<button type='button' id='iuxHeaderLayoutConfig' class='iux-header-action'><i class='fa fa-columns'></i> Layout Configuration</button>" +
    "</div>" +
    "<div class='iux-header-metrics'>" +
      "<div class='iux-header-metric'><span>Modified Tasks</span><strong class='is-modified'>" + gGanttGlobal.TasksModified.length + "</strong></div>" +
      "<div class='iux-header-metric'><span>Total WO(s) Available</span><strong class='is-total'>" + totalWorkOrders + "</strong></div>" +
      "<div class='iux-header-metric'><span>Total Hours Estimated</span><button type='button' id='iuxHeaderEstimatedHours' class='iux-header-metric-button is-estimated' title='View estimated hours by trade'>" + totalEstimatedHours + "</button></div>" +
    "</div>" +
  "</div>" +
  "<div class='iux-header-right'>" +
    "<button type='button' id='iuxHeaderLegend' class='iux-header-action iux-header-action-icon'><i class='fa fa-info'></i></button>" +
  "</div>" +
"</div>";
    var screen = EAM.Utils.getScreen();
    var header = screen && screen.getHeader ? screen.getHeader() : null;
    var moduleHeader = screen && screen.getScreen && screen.getScreen().getModuleHeader
      ? screen.getScreen().getModuleHeader()
      : null;

    if (header && header.headerData) {
      header.headerData.itemLabel = vHeaderText;
      if (moduleHeader) {
        moduleHeader.setHeight(44);
        moduleHeader.updateHeaderData();
      }
    } else {
      var h1Element = document.querySelector('.x-toolbar-text.page-header-title.x-box-item.x-toolbar-item.x-toolbar-text-default');
      if (h1Element) {
        h1Element.innerHTML = vHeaderText;
        h1Element.style.width = "100%";
        h1Element.style.display = "block";
      } else {
        console.log('module header element not found.');
      }
    }

    Ext.defer(function() {
      var analyticsBtn = document.getElementById('iuxHeaderAnalytics');
      var configBtn = document.getElementById('iuxHeaderConfig');
      var layoutConfigBtn = document.getElementById('iuxHeaderLayoutConfig');
      var estimatedHoursBtn = document.getElementById('iuxHeaderEstimatedHours');
      var legendBtn = document.getElementById('iuxHeaderLegend');
      if (analyticsBtn) analyticsBtn.onclick = function() { showAnalyticsPopup(); };
      if (configBtn) configBtn.onclick = function() { showConfigPopup(); };
      if (layoutConfigBtn) layoutConfigBtn.onclick = function() { showUserConfigurationPopup(); };
      if (estimatedHoursBtn) estimatedHoursBtn.onclick = function() { showEstimatedHoursByTradePopup(); };
      if (legendBtn) legendBtn.onclick = function() { showSystemLegendPopup(); };
    }, 50);
    updateToolbarState();
  }

  function openHyperlink(vParams) {
    var a = [];
    var g = {
      CURRENT_TAB_NAME: vParams.CURRENT_TAB_NAME,
      SYSTEM_FUNCTION_NAME: vParams.SYSTEM_FUNCTION_NAME,
      USER_FUNCTION_NAME: vParams.USER_FUNCTION_NAME,
      initpath: vParams.SYSTEM_FUNCTION_NAME,
      MENU_MODULE_KEY: "-1",
      uitheme: EAM.AppData.getUITheme(),
      fromlogin: "yes",
      hyperlinksource: "R",
      popup: "TRUE",
      skipfirstfunccheck: true
    };
    if (!Ext.isEmpty(vParams.filterfields))
      a = ["hyperlink", 1, "Q:WEBL", "COMPONENT_INFO_TYPE=HEAD_DATA&filterfields=" + vParams.filterfields + "&filteroperator=" + vParams.filteroperator + "&filtervalue=" + vParams.filtervalue + "&ADDONS_REQUIRED=true&", "", ""];
    else
      a = [];

    //EAM.ContextManager.getEAM("parent").Usage.start("screen_hyperlink");
    var b = EAM.Utils.createModal({
      header: false,
      parentContext: window
    });
    b.show();
    b.update("loadmain?" + Ext.Object.toQueryString(g), a)

  }
 

window.__IUXHUB_UI_LOADED = true;
//# sourceURL=IUXHUB.ui.js
