/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

declare module 'ibax/geo' {
    type TMapEditorType =
        'point' | 'line' | 'polygon';

    type TMapType =
        'streets' | 'satellite' | 'hybrid' | 'topo' | 'gray' | 'dark-gray' | 'oceans' | 'national-geographic' | 'terrain' | 'osm';

    interface IMapEditorEvent {
        coords: [number, number][];
        type: TMapEditorType;
        area: number;
        address: string;
    }
}