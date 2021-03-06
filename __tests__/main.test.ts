import * as core from "@actions/core";
import { AuthorizerFactory } from 'azure-actions-webclient/AuthorizerFactory';

import run from "../src/main";
import AzureSqlAction from "../src/AzureSqlAction";
import FirewallManager from "../src/FirewallManager";
import AzureSqlActionHelper from '../src/AzureSqlActionHelper';
import SqlConnectionStringBuilder from '../src/SqlConnectionStringBuilder';

jest.mock('@actions/core');
jest.mock('azure-actions-webclient/AuthorizerFactory');
jest.mock('../src/AzureSqlAction');
jest.mock('../src/FirewallManager');
jest.mock('../src/AzureSqlResourceManager');
jest.mock('../src/SqlConnectionStringBuilder');

describe('main.ts tests', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    })

    it('gets inputs and executes dacpac action', async () => {
        let resolveFilePathSpy = jest.spyOn(AzureSqlActionHelper, 'resolveFilePath').mockReturnValue('./TestDacpacPackage.dacpac');
        let getInputSpy = jest.spyOn(core, 'getInput').mockImplementation((name, options) => {
            switch(name) {
                case 'server-name': return 'test2.database.windows.net';
                case 'connection-string': return 'Server=tcp:testServer.database.windows.net, 1433;Initial Catalog=testDB;User Id=testUser;Password=testPassword;';
                case 'dacpac-package': return './TestDacpacPackage.dacpac';
            }

            return '';
        }); 
        
        let getAuthorizerSpy = jest.spyOn(AuthorizerFactory, 'getAuthorizer');
        let addFirewallRuleSpy = jest.spyOn(FirewallManager.prototype, 'addFirewallRule');
        let actionExecuteSpy = jest.spyOn(AzureSqlAction.prototype, 'execute');
        let removeFirewallRuleSpy = jest.spyOn(FirewallManager.prototype, 'removeFirewallRule');
        let setFaledSpy = jest.spyOn(core, 'setFailed');

        await run();

        expect(AzureSqlAction).toHaveBeenCalled();
        expect(getAuthorizerSpy).toHaveBeenCalled();
        expect(getInputSpy).toHaveBeenCalledTimes(4);
        expect(SqlConnectionStringBuilder).toHaveBeenCalled();
        expect(resolveFilePathSpy).toHaveBeenCalled();
        expect(addFirewallRuleSpy).toHaveBeenCalled();
        expect(actionExecuteSpy).toHaveBeenCalled();    
        expect(removeFirewallRuleSpy).toHaveBeenCalled();     
        expect(setFaledSpy).not.toHaveBeenCalled(); 
    })

    it('gets inputs and executes sql action', async () => {
        let resolveFilePathSpy = jest.spyOn(AzureSqlActionHelper, 'resolveFilePath').mockReturnValue('./TestSqlFile.sql');
        let getInputSpy = jest.spyOn(core, 'getInput').mockImplementation((name, options) => {
            switch(name) {
                case 'server-name': return 'test1.database.windows.net';
                case 'connection-string': return 'Server=tcp:testServer.database.windows.net, 1433;Initial Catalog=testDB;User Id=testUser;Password=testPassword;';
                case 'sql-file': return './TestSqlFile.sql';
                default: return '';
            }
        }); 

        let setFaledSpy = jest.spyOn(core, 'setFailed');
        let getAuthorizerSpy = jest.spyOn(AuthorizerFactory, 'getAuthorizer');
        let addFirewallRuleSpy = jest.spyOn(FirewallManager.prototype, 'addFirewallRule');
        let actionExecuteSpy = jest.spyOn(AzureSqlAction.prototype, 'execute');
        let removeFirewallRuleSpy = jest.spyOn(FirewallManager.prototype, 'removeFirewallRule');

        await run();

        expect(AzureSqlAction).toHaveBeenCalled();
        expect(getAuthorizerSpy).toHaveBeenCalled();
        expect(getInputSpy).toHaveBeenCalledTimes(5);
        expect(SqlConnectionStringBuilder).toHaveBeenCalled();
        expect(resolveFilePathSpy).toHaveBeenCalled();
        expect(addFirewallRuleSpy).toHaveBeenCalled();
        expect(actionExecuteSpy).toHaveBeenCalled();    
        expect(removeFirewallRuleSpy).toHaveBeenCalled();      
        expect(setFaledSpy).not.toHaveBeenCalled(); 
    })

    it('throws if input file is not found', async() => {
        jest.spyOn(AzureSqlActionHelper, 'resolveFilePath').mockImplementation(() => {
            throw new Error(`Unable to find file at location`);
        });
        
        jest.spyOn(core, 'getInput').mockImplementation((name, options) => {
            switch(name) {
                case 'server-name': return 'test1.database.windows.net';
                case 'connection-string': return 'Server=tcp:testServer.database.windows.net, 1433;Initial Catalog=testDB;User Id=testUser;Password=testPassword;';
                case 'sql-file': return './TestSqlFile.sql';
                default: return '';
            }
        }); 

        let setFaledSpy = jest.spyOn(core, 'setFailed');
        await run();

        expect(AzureSqlAction).not.toHaveBeenCalled();
        expect(setFaledSpy).toHaveBeenCalledWith('Unable to find file at location'); 
    })
})