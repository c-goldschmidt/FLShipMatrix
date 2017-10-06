declare const FL_URL_PREFIX: string;

export class Constants {
    static getPrefix(removeFirstSlash = false): string {
        if (removeFirstSlash) {
            return FL_URL_PREFIX.replace('/', '');
        }
        return FL_URL_PREFIX;
    }
}
