import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'filterValue',
    pure: false
})
export class FilterValuePipe implements PipeTransform {
    transform(items: any[]): any {
        if (!items) {
            return items;
        }
        return items.filter(item => !!item.displayValue);
    }
}