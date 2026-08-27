export interface simulateurParams{

    partenaire?: string;             // ex: web_sofinco
    amount?: number;                  // 2800 , 3000, 4000, ....
    dueNumber?: number;               // 36, 60, 10 ..
    productId?: string;              // RESERVE, PBPERSO, AUTOPERS ...
    projectLabel?: string;           // FAMILY_MOVING, WORK_DECORATION...
    idcatorigin?:string;             // pret_personnel, credit_auto ...
    x1?: string;                     // crs, loan ...
    sourceId?: string;               // NEOURL02, PUB22801...
    mfactoryid? : string;
}

export function buildSimulateurUrl(params: simulateurParams) : string {
    const baseURL ='https://rct.souscription.sofinco.fr/essentiel/';
    const {
            partenaire = 'web_sofinco',
            amount = 2000,
            dueNumber = 36,
            productId ='RESERVE',
            projectLabel = 'FAMILY_MOVING',
            idcatorigin,
            x1 = 'crs',
            sourceId = 'NEOURL02',
            mfactoryid
    } = params;

    const url = new URL(baseURL);
    url.searchParams.set('q6',partenaire);
    if(amount) url.searchParams.set('amount',String(amount));
    if(dueNumber) url.searchParams.set('dueNumber',String(dueNumber));
    if(productId) url.searchParams.set('productId', productId);
    if(projectLabel) url.searchParams.set('projectLabel', projectLabel);
    if(idcatorigin) url.searchParams.set('idcatorigin', idcatorigin);
    if(x1) url.searchParams.set('x1', x1);
    if(sourceId) url.searchParams.set('sourceId', sourceId);
    if(mfactoryid) url.searchParams.set('mfactoryid', mfactoryid);
    return url.toString();

}