// IUXHUB bootstrap. Loads CSS/JS dependencies before registering the Ext screen class.
(function loadIuxhubDependencies() {
  function injectScript(source, sourceName) {
    if (!source) return false;
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.text = String(source) + "\n//# sourceURL=" + sourceName;
    document.head.appendChild(script);
    return true;
  }

  function injectStyle(source, styleId) {
    if (!source) return false;
    if (document.getElementById(styleId)) return true;
    var style = document.createElement("style");
    style.id = styleId;
    style.type = "text/css";
    style.textContent = String(source);
    document.head.appendChild(style);
    return true;
  }

  function getJavaSource(recordName) {
    try {
      if (typeof EAM === "undefined" || !EAM.Ajax) return "";
      var response = EAM.Ajax.request({
        url: "BSJAVA.HDR",
        params: {
          SYSTEM_FUNCTION_NAME: "BSJAVA",
          USER_FUNCTION_NAME: "IEGANT",
          CURRENT_TAB_NAME: "HDR",
          name: recordName,
          reset_pageaction: "RESET",
          pagemode: "view",
          pageaction: "",
          SCROLLROW: "YES"
        },
        async: false
      });
      return response && response.responseData && response.responseData.pageData && response.responseData.pageData.values && response.responseData.pageData.values.sourcecode;
    } catch (e) {
      return "";
    }
  }

  function loadDependency(definition) {
    if (window[definition.flag]) return;
    var source = getJavaSource(definition.recordName);
    var loaded = definition.type === "css" ?
      injectStyle(source, definition.flag + "_STYLE") :
      injectScript(source, definition.recordName + ".js");

    if (!loaded) {
      throw new Error("Unable to load required IUXHUB dependency. Create BSJAVA record " + definition.recordName + ".");
    }
    window[definition.flag] = true;
  }

  [
    { type: "css", flag: "__IUXHUB_DHTML_CSS_LOADED", recordName: "DHTML_CSS" },
    { type: "css", flag: "__IUXHUB_DHTMLX_FILTERS_CSS_LOADED", recordName: "DHTMLX_FILTERS_CSS" },
    { type: "css", flag: "__IUXHUB_CSS_LOADED", recordName: "IUXHUB_CSS" },
    { type: "js", flag: "__IUXHUB_DHTML_SOURCE_LOADED", recordName: "DHTML_SOURCE" },
    { type: "js", flag: "__IUXHUB_DHTMLX_FILTERS_LOADED", recordName: "DHTMLX_FILTERS" },
    { type: "js", flag: "__IUXHUB_CORE_LOADED", recordName: "IUXHUB_CORE" },
    { type: "js", flag: "__IUXHUB_UI_LOADED", recordName: "IUXHUB_UI" },
    { type: "js", flag: "__IUXHUB_SHIFT_LOADED", recordName: "IUXHUB_SHIFT" }
  ].forEach(loadDependency);
})();

// Format only the Due Date shown in the Gantt tooltip (for example, 06-Sep-26).
function formatTooltipDueDate() {
  if (typeof gantt === "undefined" || !gantt.templates ||
      typeof gantt.templates.tooltip_text !== "function" ||
      gantt.templates.tooltip_text.__dueDateFormatApplied) {
    return;
  }

  var originalTooltipText = gantt.templates.tooltip_text;
  var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  var formattedTooltipText = function () {
    var tooltipHtml = originalTooltipText.apply(this, arguments);

    return String(tooltipHtml).replace(
      /(Due Date:(?:(?!Due Date:)[\s\S]){0,300}?)(\d{2})-(\d{2})-(\d{4})/i,
      function (match, prefix, day, month, year) {
        var monthIndex = Number(month) - 1;
        if (monthIndex < 0 || monthIndex > 11) return match;
        return prefix + day + "-" + monthNames[monthIndex] + "-" + year.slice(-2);
      }
    );
  };

  formattedTooltipText.__dueDateFormatApplied = true;
  gantt.templates.tooltip_text = formattedTooltipText;
}

  Ext.define('EAM.custom.external_iuxhub', {
    extend: 'EAM.custom.AbstractExtensibleFramework',
    getSelectors: function () {
      var me = this;
      return {
        'ewsusr listonly[tabName=LST]': {
          afterrender: function (a, b, c, d) {
            EAM.Utils.getMainToolbar().getEl().hide();
            EAM.Utils.getMainToolbar().setHeight("1");
            if (EAM.Utils.getScreen().userFunction == 'IUXHUB' && Ext.ComponentQuery.query('uxtabpanel')[0]) {
              try {

                Ext.ComponentQuery.query('uxtabpanel')[0].el.dom.style.height = "0px";
                var reference = Ext.ComponentQuery.query('uxtabpanel')[0].up().body.dom;
                vWidth = reference.clientWidth;
                vHeight = reference.clientHeight;

                var TabID = Ext.query("*[id^=uxtabpanel]")[0].id;
                var cmp = Ext.getCmp(TabID);
                cmp.hide();

                var vCustomDiv = document.getElementById('expertshub');
                if (vCustomDiv) {
                  vCustomDiv.parentElement.removeChild(vCustomDiv);
                };
                var node = document.createElement("div");
                node.id = 'expertshub';
                node.style.width = '100%';
                node.style.height = '100%';

                // get the parent element
                //var parent = document.getElementById("expertshub");

                // create first child div with 10% height and red background
                var child1 = document.createElement("div");
                child1.id = "my_gantt_toolbar";
                child1.style.height = "64px";
                child1.style.flex = "0 0 64px";
                //child1.style.backgroundColor = "red";

                // create second child div with 90% height and green background
                var child2 = document.createElement("div");
                child2.id = "gantt_here";
                child2.style.height = "calc(100% - 64px)";
                child2.style.flex = "1 1 auto";
                //child2.style.backgroundColor = "green";

                // add the child divs to the parent div
                node.appendChild(child1);
                node.appendChild(child2);

                //node.style.top = '0px';
                //node.style.position = 'absolute';
                reference.appendChild(node);

                me.destroyExistingComponents();
                me.initalizeStores();
                
                if (gGanttGlobal.Key == "INVALID")
                {
                  //EAM.Messaging.showConfirmation("License is expired. Please renewal the licence. Data could currupt with the continuous usage.");
                }else{
                    me.renderToolBar();
                    var processResponse = GanttDataAccess.saveSessionQuery();

                    renderGanttNow(processResponse.wspf_10_crr_data || processResponse.WSPF_10_CRR_DATA, processResponse.wspf_10_crr_resourcedata || processResponse.WSPF_10_CRR_RESOURCEDATA);
                    formatTooltipDueDate();
                    updateHeader();
                }

              } catch (e) {
                
                // EAM.Messaging.showConfirmation("License is Invalid. Data could currupt with the continuous usage.");
                
                console.log(e);
              }
            }
          }
        }
      }

    },
    
    constructor: function (config) {
      console.log("From constructor");
      this.loadDHTMLSource();
      this.loadInitialConfigurations();

    },

  

    loadInitialConfigurations: function () {
      gGanttGlobal.InitialConfigStore = GanttDataAccess.loadInitialConfigurations();
    },

    initalizeStores: function () {

      gGanttGlobal.LookAheadstore = Ext.create('Ext.data.Store', {
        id: 'lookaheadstore',
        fields: ['code', 'description'],
        data: [{
            "code": "WEEK",
            "description": "Week"
          }, {
            "code": "MONTH",
            "description": "Month"
          }, {
            "code": "QUARTER",
            "description": "Quarter"
          }, {
            "code": "YEAR",
            "description": "Year"
          }, {
            "code": "2YEAR",
            "description": "2 Years"
          }
        ]
      });
      /*
      gGanttGlobal.ScaleMode = Ext.create('Ext.data.Store', {
      id: 'scoleMode',
      fields: ['code', 'description'],
      data: [{
      "code": "2",
      "description": "Week"
      }, {
      "code": "3",
      "description": "Month",
      }, {
      "code": "4",
      "description": "Year",
      }, {
      "code": "5",
      "description": "Week Number",
      }
      ]
      });
      */
      gGanttGlobal.ListColumnsStore = [];
      gGanttGlobal.ColorCombinations = [];
      var vWOTypeStore = Ext.create('Ext.data.Store', {
        fields: ['code', 'description'],
        sorters: [{
            property: 'code',
            direction: 'ASC'
          }
        ]
      });

      var vWOStatusStore = Ext.create('Ext.data.Store', {
        fields: ['code', 'description'],
        sorters: [{
            property: 'code',
            direction: 'ASC'
          }
        ]
      });
      var vDepartmentStore = Ext.create('Ext.data.Store', {
        fields: ['code', 'description'],
        sorters: [{
            property: 'code',
            direction: 'ASC'
          }
        ]
      });
      var vOrganizationStore = Ext.create('Ext.data.Store', {
        fields: ['code', 'description'],
        sorters: [{
            property: 'code',
            direction: 'ASC'
          }
        ]
      });

      var vDataSpyStore = Ext.create('Ext.data.Store', {
        fields: ['code', 'description'],
        sorters: [{
            property: 'code',
            direction: 'ASC'
          }
        ]
      });

      var vSchedGroups = Ext.create('Ext.data.Store', {
        fields: ['code', 'description'],
        sorters: [{
            property: 'code',
            direction: 'ASC'
          }
        ]
      });

      var vPersonal = Ext.create('Ext.data.Store', {
        fields: ['code', 'description'],
        sorters: [{
            property: 'code',
            direction: 'ASC'
          }
        ]
      });

      gGanttGlobal.TasksModified = [];
      gGanttGlobal.PendingChanges = {};

      gGanttGlobal.InitialConfigStore.sort(function(a, b) {
        var aProp = parseInt(a.cfg_property, 10);
        var bProp = parseInt(b.cfg_property, 10);
        if (!isNaN(aProp) && !isNaN(bProp)) return aProp - bProp;
        if (!isNaN(aProp)) return -1;
        if (!isNaN(bProp)) return 1;
        return 0;
      });

      gGanttGlobal.InitialConfigStore.forEach((obj, index) => {
        
        /*
        * License Validation
        */
        
        if (obj.cfg_type == "LICENSE")
        {
          var key = obj.cfg_value;
          const key_1 = 'KCopOX4hIzE2ODI0MTE0MDAwMDB+ISMzMH4hIw=='  
          const key_2 = 'KCopOX4hIzE2MTkxNjQ4MDAwMDB+ISMzMH4hIw==' 
          const key_3 = 'KCopMX4hIzE2MTkxNjQ4MDAwMDB+ISM5OTk5fiEj'

          if(key === key_1 || key === key_2 || key === key_3){
            console.log("Match found.");

          // Convert to text
          const decodedString = atob(key);
          var str_1 = decodedString;
          var fourthChar = str_1.charAt(3);
          var seventhCharFromEnd = str_1.charAt(str_1.length - 7);
          const dateStr = str_1.match(/#(.*?)~/)[1];
          const date_1 = new Date(parseInt(dateStr));
          console.log(date_1);
          const noofdays = str_1.split("#")[2].split("~")[0];
          
          if (fourthChar == "1" && seventhCharFromEnd == "9"){
            console.log("Valid License.");            
            gGanttGlobal.Key = "VALID";
          }else {
            const futureDate = new Date(date_1.getTime() + (Number(noofdays) * 24 * 60 * 60 * 1000));
            
            const now = new Date();
  

            if (now >= futureDate) {
              gGanttGlobal.Key = "INVALID";
              EAM.Messaging.showConfirmation("License expired. Please reach out to IT Xperts HUb LLC to renew your license. Please be aware that your daya might get corrupted if you try to use Gantt Planner with expired license.");             
              return false;
            } else {
              // License will expire in one month, log a warning
              gGanttGlobal.Key = "VALID";
              const diffTime = Math.abs(futureDate - now);
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
              EAM.Messaging.showConfirmation("Your Gantt Planner License is about to expire in " + diffDays + " Day(s). Please contact IT Xperts HUb LLC to renew.");
              console.warn("Trial Period about to expire");
            }
          }        
        } else {
          gGanttGlobal.Key = "INVALID";
          EAM.Messaging.showConfirmation("Invalid License Key.Replace Gantt Planner License Key with the original key or contact IT Cperts Hub LLC for further assistance. Please be aware that your data might get corrupted if you try to use Gantt Planner with invalid license.");
            console.log("No match found.");
            return false;
          }
        }
        
        
        var record = {
          'code': obj.cfg_code,
          'description': obj.cfg_value
        }
        if (obj.cfg_type == "COLOR") {
          gGanttGlobal.ColorCombinations.push(record);
        }
        
        if (obj.cfg_type.startsWith('SELECT')) {

          if (obj.cfg_code == "EVT_STATUS") {
            obj.cfg_code = "EVT_STATUS_DESC";
            obj.cfg_value = obj.cfg_value;
          }

          if (obj.cfg_code == "EVT_JOBTYPE") {
            obj.cfg_code = "EVT_JOBTYPE_DESC";
          }

          if (obj.cfg_code == "PPM_PERIODUOM") {
            obj.cfg_code = "PERIODUOM_DESC";
          }

          if (obj.cfg_code == "EVT_CODE") {
        
        gGanttGlobal.ListColumnsStore.push({
          name: obj.cfg_code.toUpperCase(),
          id: obj.cfg_code.toLowerCase(),
          label: obj.cfg_value,
          width: '100',
          resize: true,
          tree : true
        });
          }else {
        
          gGanttGlobal.ListColumnsStore.push({
            name: obj.cfg_code.toUpperCase(),
            id: obj.cfg_code.toLowerCase(),
            label: obj.cfg_value,
            width: '100',
            resize: true
          });
      }


        }

        if (obj.cfg_type.startsWith('DSELECT')) {

          gGanttGlobal.ListColumnsStore.push({
            name: obj.cfg_code.toUpperCase(),
            id: obj.cfg_code.toLowerCase(),
            label: obj.cfg_value,
            width: '100',
            resize: true,
        dataType : "date",
            date_format: "%Y-%m-%d"
          });

        }

        if (obj.cfg_type == "WOSTATUS") {
          vWOStatusStore.add(record);
        }

        if (obj.cfg_type == "WOTYPE") {
          vWOTypeStore.add(record);
        }

        if (obj.cfg_type == "MRC") {
          vDepartmentStore.add(record);
        }

        if (obj.cfg_type == "ORG") {
          vOrganizationStore.add(record);
        }

        if (obj.cfg_type == "UDATASPY") {
          vDataSpyStore.add(record);
        }
  
        if (obj.cfg_type == "PERSON") {
          vPersonal.add(record);
        }
        if (obj.cfg_type == "SCHEDGROUP") {
          vSchedGroups.add(record);
        }

      });

      gGanttGlobal.SchedGroups = vSchedGroups;
      gGanttGlobal.Personal = vPersonal;

      gGanttGlobal.WorkorderStatusStore = vWOStatusStore;
      gGanttGlobal.WorkorderTypeStore = vWOTypeStore;
      gGanttGlobal.DepartmentStore = vDepartmentStore;
      gGanttGlobal.OrganizationStore = vOrganizationStore;
      gGanttGlobal.DataSpyStore = vDataSpyStore;

    },

    loadDHTMLSource: function () {
      // DHTML/CSS dependencies are loaded once by the bootstrap dependency table.
    },

    destroyExistingComponents: function () {

      var componentToDestroy = ["GanttToolBar","searchgantt", "StartDate", "lookahead", "viewscale", "viewscale_prev", "viewscale_label", "viewscale_next", "ShowExpired", "workorderstatus", "workordertype", "department", "organization", "dataspycomp", "resetFiltersButton", "reloadGanttNow", "submitGanttNow", "summaryButton", "summaryFilterIndicator", "bulkEditSwitch", "exportExcelButton"];
      var comp;

      componentToDestroy.forEach(function (component) {
        comp = Ext.getCmp(component);
        if (!Ext.isEmpty(comp)) {
          try {
            //comp.destroy();
              comp.destroy();
          } catch (e) {
            console.log("Unable to destroy : " + component);
            console.log(e);
          }
        }
      });

      var myDiv = document.getElementById("my_gantt_toolbar");
      myDiv.innerHTML = "";

    },

    renderToolBar: function () {
      // Static toolbar, timeline, and configuration styles live in IUXHUB_CSS.css.

      Ext.create('Ext.toolbar.Toolbar', {
        renderTo: my_gantt_toolbar,
        id: "GanttToolBar",
        layout: {
          type: 'hbox',
          align: 'top',
          padding: '4 0 0 0'
        },
        defaults: {
          labelStyle: 'font-size:80%; font-weight:bold;',
          labelAlign: 'top'
        },
        height: 64,
        items: [
          // ═══════════════════════════════════════════════════
          // FAR LEFT — Scale stays pinned to the left edge
          // ═══════════════════════════════════════════════════
          {
            xtype: 'fieldcontainer',
            id: 'viewscale',
            fieldLabel: 'Scale',
            labelAlign: 'top',
            labelStyle: 'font-size:80%; font-weight:bold;',
            labelCls: 'gantt_form_label',
            margin: '0 6 5 0',
            width: 112,
            layout: { type: 'hbox', align: 'middle' },
            items: [
              {
                xtype: 'button',
                id: 'viewscale_prev',
                text: '<i class="fa fa-chevron-left"></i>',
                width: 25,
                height: 25,
                style: { 'font-size': '12px' },
                handler: function () {
                  var levels = ['Day', 'Week', 'Month', 'Quarter', 'Year'];
                  var curr = gantt.ext.zoom.getCurrentLevel();
                  var prev = (curr <= 0) ? 4 : curr - 1;
                  gantt.ext.zoom.setLevel(prev);
                  Ext.getCmp('viewscale_label').setText(levels[prev]);
                }
              },
              {
                xtype: 'button',
                id: 'viewscale_label',
                text: getZoomLevelLabel("day"),
                disabled: true,
                disabledCls: '',
                width: 56,
                height: 25,
                style: {
                  'font-size': '80%',
                  'font-weight': 'bold',
                  'border-radius': '4px',
                  'cursor': 'default',
                  'color': '#333',
                  'background': '#f0f0f0',
                  'border': '1px solid #d0d0d0'
                }
              },
              {
                xtype: 'button',
                id: 'viewscale_next',
                text: '<i class="fa fa-chevron-right"></i>',
                width: 25,
                height: 25,
                style: { 'font-size': '12px' },
                handler: function () {
                  var levels = ['Day', 'Week', 'Month', 'Quarter', 'Year'];
                  var curr = gantt.ext.zoom.getCurrentLevel();
                  var next = (curr >= 4) ? 0 : curr + 1;
                  gantt.ext.zoom.setLevel(next);
                  Ext.getCmp('viewscale_label').setText(levels[next]);
                }
              }
            ]
          },

          // ═══════════════════════════════════════════════════
          // CENTER GROUP — Filter fields (equal spacing, centered)
          // ═══════════════════════════════════════════════════
          {
            xtype: 'component',
            id: 'bulkEditSwitch',
            hidden: !isFeatureEnabled('bulkEdit'),
            margin: '0 14 5 0',
            html: '<div class="iux-toolbar-switch-wrap">' +
                    '<div class="iux-toolbar-switch-label">Bulk Edit</div>' +
                    '<label class="gantt-cfg-toggle iux-toolbar-switch">' +
                      '<input type="checkbox" id="bulkEditSwitchInput" ' + (gGanttGlobal.ganttConfig.bulkEditEnabled ? 'checked' : '') + '>' +
                      '<span class="gantt-cfg-slider"></span>' +
                    '</label>' +
                    '<span id="bulkEditModeBadge" class="iux-bulk-mode-badge ' + (gGanttGlobal.ganttConfig.bulkEditEnabled ? 'is-on' : 'is-off') + '">' + (gGanttGlobal.ganttConfig.bulkEditEnabled ? 'Bulk Edit ON' : 'Bulk Edit OFF') + '</span>' +
                    '<span id="bulkEditSelectedBadge" class="iux-bulk-selected-badge" style="display:' + (gGanttGlobal.ganttConfig.bulkEditEnabled ? 'inline-flex' : 'none') + ';">Selected: 0</span>' +
                  '</div>',
            listeners: {
              afterrender: function(cmp) {
                var input = cmp.getEl().dom.querySelector('#bulkEditSwitchInput');
                if (!input) return;
                input.addEventListener('change', function() {
                  if (!isFeatureEnabled('bulkEdit')) {
                    input.checked = false;
                    gGanttGlobal.ganttConfig.bulkEditEnabled = false;
                    return;
                  }
                  gGanttGlobal.ganttConfig.bulkEditEnabled = input.checked;
                  applyBulkEditColumn(true);
                  updateToolbarState();
                });
              }
            }
          },
          { xtype: 'tbfill' },
          {
            xtype: 'component',
            id: 'ShowExpired',
            margin: '0 18 5 0',
            value: false,
            html: '<div class="iux-toolbar-switch-wrap iux-overdue-switch-wrap">' +
                    '<div class="iux-toolbar-switch-label">Overdue WOs</div>' +
                    '<label class="gantt-cfg-toggle iux-toolbar-switch">' +
                      '<input type="checkbox" id="overdueWoSwitchInput">' +
                      '<span class="gantt-cfg-slider"></span>' +
                    '</label>' +
                  '</div>',
            listeners: {
              afterrender: function (cmp) {
                var input = cmp.getEl().dom.querySelector('#overdueWoSwitchInput');
                cmp.getValue = function() { return !!cmp.value; };
                cmp.setValue = function(value) {
                  cmp.value = !!value;
                  if (input) input.checked = cmp.value;
                };
                if (!input) return;
                input.addEventListener('change', function() {
                  cmp.value = input.checked;
                  Ext.getCmp("reloadGanttNow").addCls('highlight-button');
                });
              }
            }
          },
          {
            id: "lookahead",
            xtype: 'combobox',
            store: gGanttGlobal.LookAheadstore,
            queryMode: 'local',
            displayField: 'description',
            valueField: 'code',
            width: 115,
            height: 28,
            fieldCls: "gantt_form_field",
            labelCls: "gantt_form_label",
            labelStyle: 'font-size:80%; font-weight:bold;',
            labelAlign: 'top',
            fieldStyle: 'font-size:80%;',
            value: "MONTH",
            margin: '0 6 5 0',
            fieldLabel: 'Lookahead',
            tpl: Ext.create('Ext.XTemplate',
              '<ul class="x-list-plain"><tpl for=".">',
              '<li role="option" class="x-boundlist-item gantt_font_size" style="font-size:80%;">{description}</li>',
              '</tpl></ul>'),
            listeners: {
              change: function () {
                Ext.getCmp("reloadGanttNow").addCls('highlight-button');
              }
            }
          },
          {
            xtype: 'uxdate',
            width: 115,
            height: 28,
            fieldCls: "gantt_form_field",
            labelCls: "gantt_form_label",
            labelStyle: 'font-size:80%; font-weight:bold;',
            labelAlign: 'top',
            fieldLabel: 'From Date',
            id: 'StartDate',
            value: getDefaultStartDate(),
            margin: '0 6 5 0',
            listeners: {
              change: function () {
                Ext.getCmp("reloadGanttNow").addCls('highlight-button');
              }
            }
          },
          {
            xtype: 'combobox',
            store: gGanttGlobal.WorkorderStatusStore,
            queryMode: 'local',
            displayField: 'description',
            valueField: 'code',
            value: "ALL",
            id: "workorderstatus",
            labelAlign: 'top',
            labelStyle: 'font-size:80%; font-weight:bold;',
            fieldLabel: 'WO Status',
            margin: '0 6 5 0',
            width: 115,
            height: 28,
            fieldCls: "gantt_form_field",
            labelCls: "gantt_form_label",
            fieldStyle: 'font-size:80%;',
            tpl: Ext.create('Ext.XTemplate',
              '<ul class="x-list-plain"><tpl for=".">',
              '<li role="option" class="x-boundlist-item gantt_font_size" style="font-size:80%;"><b>{code}</b> - {description}</li>',
              '</tpl></ul>'),
            listeners: {
              change: function () {
                Ext.getCmp("reloadGanttNow").addCls('highlight-button');
              }
            }
          },
          {
            xtype: 'combobox',
            store: gGanttGlobal.WorkorderTypeStore,
            queryMode: 'local',
            displayField: 'description',
            valueField: 'code',
            value: "ALL",
            id: "workordertype",
            labelAlign: 'top',
            labelStyle: 'font-size:80%; font-weight:bold;',
            fieldLabel: 'WO Type',
            margin: '0 6 5 0',
            width: 115,
            height: 28,
            fieldCls: "gantt_form_field",
            labelCls: "gantt_form_label",
            fieldStyle: 'font-size:80%;',
            tpl: Ext.create('Ext.XTemplate',
              '<ul class="x-list-plain"><tpl for=".">',
              '<li role="option" class="x-boundlist-item gantt_font_size" style="font-size:80%;"><b>{code}</b> - {description}</li>',
              '</tpl></ul>'),
            listeners: {
              change: function () {
                Ext.getCmp("reloadGanttNow").addCls('highlight-button');
              }
            }
          },
          {
            xtype: 'combobox',
            store: gGanttGlobal.DepartmentStore,
            queryMode: 'local',
            displayField: 'description',
            valueField: 'code',
            value: "ALL",
            id: "department",
            labelAlign: 'top',
            labelStyle: 'font-size:80%; font-weight:bold;',
            fieldLabel: 'Department',
            margin: '0 6 5 0',
            width: 115,
            height: 28,
            fieldCls: "gantt_form_field",
            labelCls: "gantt_form_label",
            fieldStyle: 'font-size:80%;',
            tpl: Ext.create('Ext.XTemplate',
              '<ul class="x-list-plain"><tpl for=".">',
              '<li role="option" class="x-boundlist-item gantt_font_size" style="font-size:80%;"><b>{code}</b> - {description}</li>',
              '</tpl></ul>'),
            listeners: {
              change: function () {
                Ext.getCmp("reloadGanttNow").addCls('highlight-button');
              }
            }
          },
          {
            xtype: 'combobox',
            store: gGanttGlobal.OrganizationStore,
            queryMode: 'local',
            displayField: 'description',
            valueField: 'code',
            value: "ALL",
            id: "organization",
            labelAlign: 'top',
            labelStyle: 'font-size:80%; font-weight:bold;',
            fieldLabel: 'Organization',
            margin: '0 6 5 0',
            width: 115,
            height: 28,
            fieldCls: "gantt_form_field",
            labelCls: "gantt_form_label",
            fieldStyle: 'font-size:80%;',
            tpl: Ext.create('Ext.XTemplate',
              '<ul class="x-list-plain"><tpl for=".">',
              '<li role="option" class="x-boundlist-item gantt_font_size" style="font-size:80%;"><b>{code}</b> - {description}</li>',
              '</tpl></ul>'),
            listeners: {
              change: function () {
                Ext.getCmp("reloadGanttNow").addCls('highlight-button');
              }
            }
          },
          {
            xtype: 'combobox',
            store: gGanttGlobal.DataSpyStore,
            queryMode: 'local',
            displayField: 'description',
            valueField: 'code',
            value: getFirstDataSpyValue(),
            id: "dataspycomp",
            labelAlign: 'top',
            labelStyle: 'font-size:80%; font-weight:bold;',
            fieldLabel: 'DataSpy',
            margin: '0 6 5 0',
            width: 115,
            height: 28,
            fieldCls: "gantt_form_field",
            labelCls: "gantt_form_label",
            fieldStyle: 'font-size:80%;',
            triggers: {
              editDataSpy: {
                cls: 'x-form-edit-trigger',
                handler: function () {
                  var vParameters = {};
                  vParameters.SYSTEM_FUNCTION_NAME = 'EWSUSR';
                  vParameters.USER_FUNCTION_NAME = 'IUDATA';
                  vParameters.CURRENT_TAB_NAME = "LST";
                  vParameters.initpath = "EWSUSR?USER_FUNCTION_NAME=IUDATA&FUNCTION_CLASS=WEBD";
                  openHyperlink(vParameters);
                },
                tooltip: 'Edit DataSpy'
              }
            },
            tpl: Ext.create('Ext.XTemplate',
              '<ul class="x-list-plain"><tpl for=".">',
              '<li role="option" class="x-boundlist-item gantt_font_size" style="font-size:80%;"><b>{code}</b> - {description}</li>',
              '</tpl></ul>'),
            listeners: {
              change: function () {
                Ext.getCmp("reloadGanttNow").addCls('highlight-button');
              }
            }
          },
          {
            xtype: "textfield",
            labelAlign: 'top',
            labelStyle: 'font-size:80%; font-weight:bold;',
            fieldLabel: 'Search',
            maxLength: 100,
            width: 115,
            height: 28,
            id: "searchgantt",
            margin: '-5 6 5 0',
            fieldStyle: 'font-size:80%;',
            emptyText: 'Global Search',
            listeners: {
              change: function () {
                Ext.getCmp("reloadGanttNow").addCls('highlight-button');
              }
            }
          },
          {
            xtype: 'button',
            id: 'resetFiltersButton',
            text: '<i class="fa fa-eraser" style="margin-right:6px;"></i>Reset Filters',
            height: 28,
            margin: '15 6 5 0',
            style: { 'font-size': '80%' },
            tooltip: 'Clear toolbar, summary, search, and column filters',
            handler: function() { resetAllGanttFilters(); }
          },
          { xtype: 'tbfill' },

          // ═══════════════════════════════════════════════════
          // FAR RIGHT — Action buttons pinned to the right edge
          // ═══════════════════════════════════════════════════
          { xtype: 'tbfill' },

          {
            xtype: 'button',
            id: "reloadGanttNow",
            text: '<i class="fa fa-refresh" style="margin-right:6px;"></i>Refresh',
            height: 28,
            margin: '15 4 5 4',
            style: { 'font-size': '80%' },
            listeners: {
              click: function (button) {
                if (gGanttGlobal.TasksModified && gGanttGlobal.TasksModified.length > 0) {
                  EAM.Messaging.showQuestion({
                    msg: 'You have ' + gGanttGlobal.TasksModified.length + ' unsaved modified task(s). Refreshing will discard all changes. Do you want to continue?',
                    buttons: Ext.MessageBox.YESNO,
                    icon: Ext.MessageBox.WARNING,
                    fn: function(buttonId) {
                      if (buttonId === 'yes') { performRefresh(); }
                    },
                    scope: this
                  });
                } else {
                  performRefresh();
                }
                function performRefresh() {
                  EAM.Utils.mask();
                  setTimeout(function() {
                    try {
                      var processResponse = GanttDataAccess.saveSessionQuery();
                      renderGanttNow(processResponse.wspf_10_crr_data || processResponse.WSPF_10_CRR_DATA, processResponse.wspf_10_crr_resourcedata || processResponse.WSPF_10_CRR_RESOURCEDATA);
                      formatTooltipDueDate();
                      Ext.getCmp("reloadGanttNow").removeCls('highlight-button');
                      Ext.getCmp("submitGanttNow").removeCls('highlight-button');
                      gGanttGlobal.TasksModified = [];
                      gGanttGlobal.PendingChanges = {};
                      updateHeader();
                    } catch (e) {
                      console.error("Error during refresh:", e);
                      EAM.Messaging.showConfirmation("An error occurred during refresh. Please try again.");
                    } finally {
                      EAM.Utils.unmask();
                    }
                  }, 100);
                }
              }
            }
          },
          {
            xtype: 'button',
            id: "submitGanttNow",
            text: '<i class="fa fa-save" style="margin-right:6px;"></i>Save Changes',
            height: 28,
            disabled: !(gGanttGlobal.TasksModified && gGanttGlobal.TasksModified.length > 0),
            margin: '15 4 5 4',
            style: { 'font-size': '80%' },
            listeners: {
              click: function () {
                showChangesReviewPopup();
              }
            }
          },
          {
            xtype: 'button',
            id: 'summaryButton',
            hidden: !isFeatureEnabled('summary'),
            text: '<i class="fa fa-chart-pie" style="margin-right:6px;"></i>Summary',
            height: 28,
            margin: '15 4 5 4',
            style: { 'font-size': '80%' },
            tooltip: 'Show work order summary',
            handler: function() { showSummaryPopup(); }
          },
          {
            xtype: 'button',
            id: 'summaryFilterIndicator',
            hidden: true,
            text: '',
            height: 28,
            margin: '15 4 5 4',
            style: {
              'font-size': '80%',
              'background-color': '#fff3cd',
              'background-image': 'none',
              'border-color': '#ffc107'
            },
            tooltip: 'Summary filter active. Click to remove this filter.',
            handler: function() { clearSummaryFilter(); }
          },
          {
            xtype: 'button',
            id: 'exportExcelButton',
            hidden: !isFeatureEnabled('excelDownload'),
            text: '<i class="fa fa-file-excel-o" style="margin-right:6px;"></i>Excel',
            height: 28,
            margin: '15 4 5 4',
            style: { 'font-size': '80%' },
            tooltip: 'Export current Gantt to Excel with colors',
            handler: function() { exportGanttToExcel(); }
          }
        ],
        overflowHandler: 'menu'
      });

  // Function to enhance filter inputs with Enter key and button
  function enhanceFilterInput(input) {
    if (!input) return;
    // skip if already processed
    if (input.dataset.filterEnhanced) return;
    input.dataset.filterEnhanced = "true";

    if (!input.parentNode) {
        return; // detached element
    }

    // prevent default keystroke behaviour
    ['keyup','input'].forEach(evt => {
        input.addEventListener(evt, function(e){
            e.preventDefault();
            e.stopImmediatePropagation();
            return false;
        }, true);
    });

    // Listen for Enter key
    input.addEventListener('keydown', function(e){
        if (e.key === 'Enter' || e.keyCode === 13) {
            e.preventDefault();
            e.stopPropagation();
            applyColumnFiltersTrigger(input); 
            return false;
        }
    });

    // add clickable Enter button for text filters only - placed inline
    if (input.hasAttribute('data-text-filter')) {
        // Make container responsive so it resizes with the column
        var wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.alignItems = 'center';
        wrapper.style.width = '100%';
        wrapper.style.boxSizing = 'border-box';
        wrapper.style.gap = '4px';

        // Make input flexible inside the wrapper so it grows/shrinks with column
        input.style.flex = '1 1 auto';
        input.style.minWidth = '0';
        input.style.width = '100%';
        input.style.boxSizing = 'border-box';

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.innerHTML = '⏎';
        btn.className = 'iux-column-filter-apply';
        btn.innerHTML = '&#9166;';
        btn.title = 'Press Enter or click to filter';
        btn.style.padding = '2px 6px';
        btn.style.cursor = 'pointer';
        btn.style.backgroundColor = '#f8fafc';
        btn.style.border = '1px solid #cbd5e1';
        btn.style.borderRadius = '6px';
        btn.style.color = '#111827';
        btn.style.fontWeight = '700';
        btn.style.fontSize = '13px';
        btn.style.zIndex = '10';
        btn.style.flex = '0 0 auto';
        btn.style.height = '26px';

        btn.addEventListener('click', function(e){
          e.preventDefault();
          e.stopPropagation();
          applyColumnFiltersTrigger(input);
          return false;
        });

        // Replace the input in DOM with wrapper containing input + button
        var parent = input.parentNode;
        if (parent) {
          parent.replaceChild(wrapper, input);
          wrapper.appendChild(input);
          wrapper.appendChild(btn);
        }
    }
  }

  // Function to trigger filter application
  function applyColumnFiltersTrigger(triggerInput) {
    // Apply all active filters
    applyColumnFilters();
    
    // Update the header count with filtered results
    updateHeader();
    
    // Restore focus to triggering input
    if (triggerInput) {
        var colName = triggerInput.getAttribute(
            triggerInput.hasAttribute('data-text-filter') 
                ? 'data-text-filter' 
                : 'data-date-filter'
        );

        setTimeout(function() {
            var selector = 
                "input[data-text-filter='" + colName + "'], " +
                "input[data-date-filter='" + colName + "']";

            var newInput = document.querySelector(selector);

            if (newInput) {
                newInput.focus();
                var val = newInput.value;
                newInput.setSelectionRange(val.length, val.length);

                newInput.style.backgroundColor = "#ffffcc";
                setTimeout(function(){
                    newInput.style.backgroundColor = "";
                }, 800);
            }
        }, 50);
    }
  }

  // Process all current filter inputs
  function processAllFilters() {
    document.querySelectorAll('input[data-text-filter], input[data-date-filter]').forEach(enhanceFilterInput);
  }

  // Initialize filter inputs and watch for new ones
  setTimeout(function () {
    processAllFilters();
    // watch for new filter inputs
    var observer = new MutationObserver(function(mutations){
        mutations.forEach(function(m){
            m.addedNodes.forEach(function(n){
                if (n.nodeType !== 1) return;
                if (n.matches && (n.matches('input[data-text-filter], input[data-date-filter]'))) {
                    enhanceFilterInput(n);
                }
                var descendants = n.querySelectorAll ? n.querySelectorAll('input[data-text-filter], input[data-date-filter]') : [];
                descendants.forEach(enhanceFilterInput);
            });
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }, 800);
    },

  });

  //# sourceURL=external_iuxhub.js
