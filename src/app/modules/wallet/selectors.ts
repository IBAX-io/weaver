/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { INetwork } from 'ibax/auth';
import { IRootState } from 'modules';
import { isHttpsUrl } from 'lib/settings/httpsUrl';
import { signedInSession } from 'modules/auth/selectors';

// The stored network the signed-in session is on (its settings: block explorer, id)
export const sessionNetwork = (state: IRootState): INetwork | null => {
    const session = signedInSession(state);
    return (session && state.storage.networks.find(network => network.uuid === session.network.uuid)) || null;
};

// That network's block explorer, when it has one at an https address: the account's address is
// sent to it (one stored otherwise, such as by hand or an older version, is not used)
export const sessionExplorer = (state: IRootState): string | null => {
    const network = sessionNetwork(state);
    return network && network.explorer && isHttpsUrl(network.explorer) ? network.explorer : null;
};

// What the user agrees to: this network's addresses going to this explorer. Another explorer for
// the network (its settings changed) is asked for again.
export const explorerConsent = (networkUuid: string, explorer: string) => `${networkUuid} ${explorer}`;

// Whether the user agreed to send account addresses to the session network's block explorer
export const explorerAllowed = (state: IRootState) => {
    const network = sessionNetwork(state);
    const explorer = sessionExplorer(state);
    return !!network && !!explorer && (state.storage.explorerAllowed || []).includes(explorerConsent(network.uuid, explorer));
};
