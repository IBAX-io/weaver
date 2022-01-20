/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

class IdGenerator {
    private counter: number = 0;
    setCounter(counter: number) {
        this.counter = counter;
    }
    generateId() {
        return 'tag_' + this.counter++;
    }
    generateRandId() {
        return 'tag_' + (10000000 + Math.floor(Math.random() * 89999999));
    }
}

export default IdGenerator;