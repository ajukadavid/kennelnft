import { Injectable } from "@angular/core";
import { Observable, Subject } from "rxjs";

@Injectable({
    providedIn: "root"
})
export class NotifyService {

    private notifyStatus: Subject<any> = new Subject();
    public notifyStatus$: Observable<any> = this.notifyStatus.asObservable();

    constructor() {
    }

    public pop(type: string, message: string, title: string) {
        this.notifyStatus.next({ type, message, title });
    }
}
