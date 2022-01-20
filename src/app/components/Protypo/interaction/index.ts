/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export type TEvent = {
    'input_change': {
        name: string;
        value: string;
    };
};

export type TReaction =
    'show' | 'hide';

export interface ICondition {
    [input: string]: string;
}

export type TConditionMap = {
    [K in TReaction]?: boolean;
};

class InteractionManager {
    private _inputValues: {
        [input: string]: string;
    } = {};
    private _listeners: {
        [id: string]: {
            [R in TReaction]?: ICondition[];
        }
    } = {};

    registerReaction(id: string, reaction: TReaction, conditions: ICondition[]) {
        if (!this._listeners[id]) {
            this._listeners[id] = {};
        }

        this._listeners[id][reaction] = conditions;
    }

    on<T extends keyof TEvent>(action: T, event: TEvent[T]) {
        switch (action) {
            case 'input_change':
                this._inputValues[event.name] = event.value;
                break;

            default:
                return;
        }
    }

    getConditionFor(id: string, reaction: TReaction, condition: ICondition) {
        for (let input in condition) {
            if (condition.hasOwnProperty(input)) {
                if (this._inputValues[input] !== condition[input]) {
                    return false;
                }
            }
        }

        return true;
    }

    getConditionsFor(id: string, reaction: TReaction) {
        const conditions = this._listeners[id][reaction];

        for (let i = 0; i < conditions.length; i++) {
            const condition = conditions[i];
            if (this.getConditionFor(id, reaction, condition)) {
                return true;
            }
        }

        return false;
    }

    getConditionMap<A>(): { [id: string]: TConditionMap } {
        const result: { [id: string]: TConditionMap } = {};

        Object.keys(this._listeners).forEach(id => {
            const listener = this._listeners[id];
            result[id] = {};

            Object.keys(listener).forEach((reaction: TReaction) => {
                result[id][reaction] = this.getConditionsFor(id, reaction);
            });
        });

        return result;
    }
}

export default InteractionManager;