/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

const TxDissect = (forsign: string) => {
    const matches = /([a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}),[0-9]+,([0-9]+),(.*)/i.exec(forsign);
    return {
        requestID: matches[1],
        timestamp: parseInt(matches[2], 10),
        body: matches[3]
    };
};

export default TxDissect;