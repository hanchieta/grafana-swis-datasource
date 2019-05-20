///<reference path="../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />

import _ from "lodash";
import { QueryCtrl } from 'app/plugins/sdk';
import './css/query-editor.css!'

export interface SwisQuery {
    refId: string;
    format: string;
    alias: string;
    rawSql: string;
}

export interface QueryMeta {
    sql: string;
}

// const defaultQuery = `SELECT
//   $__timeEpoch(<time_column>),
//   <value column> as value,
//   <series name column> as metric
// FROM
//   <entity name>
// WHERE
//   $__timeFilter(time_column)
// ORDER BY
//   <time_column> ASC`;

const defaultQuery = `SELECT
     LastSync, 
     Caption,
     CPULoad, 
     ResponseTime 
FROM
     Orion.Nodes`;

export class SwisQueryCtrl extends QueryCtrl {
    static templateUrl = 'partials/query.editor.html';

    showLastQuerySQL: boolean;
    formats: any[];
    target: SwisQuery;
    lastQueryMeta: QueryMeta;
    lastQueryError: string;
    showHelp: boolean;


    constructor($scope, $injector) {
        super($scope, $injector);

        this.target.format = this.target.format || 'time_series';
        this.target.alias = '';
        this.formats = [{ text: 'Time series', value: 'time_series' }, { text: 'Table', value: 'table' }];

        if (!this.target.rawSql) {
            // special handling when in table panel
            if (this.panelCtrl.panel.type === 'table') {
                this.target.format = 'table';
                this.target.rawSql = 'SELECT 1';
            } else {
                this.target.rawSql = defaultQuery;
            }
        }

        this.panelCtrl.events.on('data-received', this.onDataReceived.bind(this), $scope);
        this.panelCtrl.events.on('data-error', this.onDataError.bind(this), $scope);
    }

    onDataReceived(dataList) {
        this.lastQueryMeta = null;
        this.lastQueryError = null;

        const anySeriesFromQuery = _.find(dataList, { refId: this.target.refId });
        if (anySeriesFromQuery) {
            this.lastQueryMeta = anySeriesFromQuery.meta;
        }
    }

    onDataError(err) {
        if (err.data && err.data.results) {
            const queryRes = err.data.results[this.target.refId];
            if (queryRes) {
                this.lastQueryMeta = queryRes.meta;
                this.lastQueryError = queryRes.error;
            }
        }
    }
}
