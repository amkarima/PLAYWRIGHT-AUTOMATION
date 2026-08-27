import { test, chromium, Page } from '@playwright/test';
import jdd from '../../datas/jdd/cr-3000.json';

import * as steps from '../../steps/souscriptionSteps';


test.describe.configure({ mode: 'parallel' });

test(' FEATURES| By pass Linxo',  { tag: ['@features'],},async ({ page }) => { 
    
const {data, idRecto, idVerso} = await steps.GenenrationDeDonneDeTest(jdd);
const params ={
    amount : 2000
}

 await steps.CommencerLaSouscription(page, params);
 await steps.miniSimulateur(page,data);
 await steps.ValiderLaPedagogie(page)
 await steps.identification(page,data,idRecto,idVerso)
 await steps.Finances(page,data)
 await steps.ProfessionEtRevenusEtAdresse(page,data);
 await steps.Assurance(page,false);
 await steps.Carte(page,true);
 await steps.Recapitulatif(page);
 await steps.OffreDeFinancement(page);

});
