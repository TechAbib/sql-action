import * as core from '@actions/core';
import * as exec from '@actions/exec';
import { AzureSqlActionHelper } from './AzureSqlActionHelper';
import { SqlConnectionString } from './ConnectionStringParser';

export enum ActionType {
    DacpacAction,
    SqlAction
}

export interface IActionInputs {
    serverName: string;
    actionType: ActionType;
    connectionString: string;
    parsedConnectionString: SqlConnectionString;
    additionalArguments?: string;
}

export interface IDacpacActionInputs extends IActionInputs {
    dacpacPackage: string;
    sqlpackageAction: SqlPackageAction; 
}

export interface ISqlActionInputs extends IActionInputs {
    sqlFile: string;
}

export enum SqlPackageAction {
    // Only the Publish action is supported currently
    Publish,
    Extract,
    Export,
    Import,
    DriftReport,
    DeployReport,
    Script
}

export class AzureSqlAction {
    constructor(inputs: IActionInputs) {
        this._inputs = inputs;
    }

    public async execute() {
        if (this._inputs.actionType === ActionType.DacpacAction) {
            await this._executeDacpacAction(this._inputs as IDacpacActionInputs);
        }
        else if (this._inputs.actionType === ActionType.SqlAction) {
            await this._executeSqlFile(this._inputs as ISqlActionInputs);
        }
        else {
            throw new Error(`Invalid AzureSqlAction '${this._inputs.actionType}'.`)
        }
    }

    private async _executeDacpacAction(inputs: IDacpacActionInputs) {   
        core.debug('Begin executing action')
        let sqlPackagePath = await AzureSqlActionHelper.getSqlPackagePath();
        let sqlPackageArgs = this._getSqlPackageArguments(inputs);

        await exec.exec(`"${sqlPackagePath}"`, sqlPackageArgs, {
            windowsVerbatimArguments: true
        });
        
        console.log(`Successfully executed action ${SqlPackageAction[inputs.sqlpackageAction]} on target database.`);
    }

    private async _executeSqlFile(inputs: ISqlActionInputs) {
        let sqlCmdPath = await AzureSqlActionHelper.getSqlCmdPath();
        
        await exec.exec(`"${sqlCmdPath}" -S xaxle.database.windows.net -d ${inputs.parsedConnectionString.database} -U ${inputs.parsedConnectionString.userId} -P ${inputs.parsedConnectionString.password}  -i "${inputs.sqlFile}"`);
        console.log(`Successfully executed Sql file on target database.`);
    }

    private _getSqlPackageArguments(inputs: IDacpacActionInputs) {
        let args: string[] = [];

        switch (inputs.sqlpackageAction) {
            case SqlPackageAction.Publish: {
                args.push(`/Action:Publish`)
                args.push(`/TargetConnectionString:"${inputs.connectionString}"`);
                args.push(`/SourceFile:"${inputs.dacpacPackage}"`);
                break;
            }
            default: {
                throw new Error(`Not supported SqlPackage action: '${SqlPackageAction[inputs.sqlpackageAction]}'`);
            }
        }

        if (!!inputs.additionalArguments) {
            args.concat(inputs.additionalArguments.split(' '));
        }

        return args;
    }   

    private _inputs: IActionInputs;
}