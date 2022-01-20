/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import React from 'react';
import propTypes from 'prop-types';
import InteractionManager, { TConditionMap, TReaction } from '../interaction';

type TComponentConstructor<T> = React.ComponentClass<T & IInteractiveComponentProps> | React.SFC<T & IInteractiveComponentProps>;

export interface IVisibilityCondition {
    [key: string]: string;
}

export interface IInteractiveComponentReactions {
    show?: IVisibilityCondition[];
    hide?: IVisibilityCondition[];
}

export interface IInteractiveComponentProps extends IInteractiveComponentReactions {
    id: string;
}

export interface IInteractiveComponentContext {
    interactionManager: InteractionManager;
    conditionMap: { [id: string]: TConditionMap };
}

const conditionContext: { [K in TReaction]: keyof IInteractiveComponentReactions } = {
    show: 'show',
    hide: 'hide'
};

const tryRegisterConditions = (props: IInteractiveComponentProps, interactionManager: InteractionManager) => {
    if (interactionManager) {
        Object.keys(conditionContext).forEach((reaction: TReaction) => {
            const dependentPropName = conditionContext[reaction];
            const dependentProp = props[dependentPropName];

            if (dependentProp && dependentProp.length) {
                interactionManager.registerReaction(props.id, reaction, dependentProp);
            }
        });
    }
};

const bindComponent: <T>(Component: TComponentConstructor<T & IInteractiveComponentProps>) => React.SFC<IInteractiveComponentProps> = (Component) => {
    const BoundComponent: React.SFC<IInteractiveComponentProps> = (props, context: IInteractiveComponentContext) => {
        const conditionMap = (context.conditionMap && context.conditionMap[props.id]) || {};
        tryRegisterConditions(props, context.interactionManager);

        if (false === conditionMap.show || true === conditionMap.hide) {
            return null;
        }
        else {
            return <Component {...props} />;
        }
    };
    BoundComponent.contextTypes = {
        interactionManager: propTypes.instanceOf(InteractionManager),
        conditionMap: propTypes.object
    };

    return BoundComponent;
};

export default function interactiveComponent<T>(Component: TComponentConstructor<T & IInteractiveComponentProps>) {
    const BoundComponent = bindComponent<T>(Component);

    return (props: T & IInteractiveComponentProps) => (
        <BoundComponent {...props} />
    );
}