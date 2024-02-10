export class WrappedPromise {
    promise: Promise<CartesifyBackendReport>
    reject?: (reason?: any) => void;
    resolve?: (value: CartesifyBackendReport | PromiseLike<CartesifyBackendReport>) => void;
    constructor() {
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        })
    }
}

interface CartesifyBackendReport {
    command: string
    success?: any
    error?: any
}
