declare global {
    interface String {
        replaceAll(search: string, replace: string): string;
    }
}

export class InfocardUtils {
    private XML_PREFIX = '<?xml version="1.0" encoding="UTF-16"?><RDL><PUSH/>';
    private XML_SUFFIX = '<POP/></RDL>';
    private XML_RESET_COLOR_TAG = '<TRA data="0x00000000" mask="-1" def="-1"/>'
    private XML_RESET_JUST_TAG = '<JUST loc="left"/>'

    bbToHTML(input: string) {
        input = input.replace(' ', '&nbsp;')
        input = input.replace(/\[br\]/g, '<font color="#333333">[br]</font><br />');
        input = input.replace(/\[(right|center|[bui])\]/g, '<$1>[$1]');
        input = input.replace(/\[\/(right|center|[bui])\]/g, '[/$1]</$1>');
        input = input.replace(/\[color=(.+?)\]/g, '<font color="$1">[color=$1]');
        input = input.replace(/\[\/color\]/g, '[/color]</font>');

        return input;
    }

    xmlToHtml(input: string) {
        const bb = this.xmlToBBCode(input);

        let output = bb.replace(' ', '&nbsp;')
        output = output.replace(/\[br\]/g, '<br />');
        output = output.replace(/\[(right|center|[bui])\]/g, '<$1>');
        output = output.replace(/\[\/(right|center|[bui])\]/g, '</$1>');
        output = output.replace(/\[color=(.+?)\]/g, '<font color="$1">');
        output = output.replace(/\[\/color\]/g, '</font>');

        return output;
    }

    xmlToBBCode(input: string) {
        input = this.cleanResetTags(input);
        let output = '';

        while (input.indexOf('<TEXT>') > -1) {
            const txtStartIndex = input.indexOf('<TEXT>');
            const txtENDIndex = input.indexOf('</TEXT>');
            let text = input.slice(txtStartIndex + 6, txtENDIndex);

            text = text.replace('<PARA/>', '<br />')

            const tags = this.parseXMLTags(input.slice(0, txtStartIndex));

            output += tags[0];
            output += text.replaceAll(' ', '&nbsp;');
            output += tags[1];

            input = input.slice(txtENDIndex + 7)
        }

        output = this.parseJustification(output);

        return output;
    }

    cleanResetTags(input: string) {
        input = input.replace(this.XML_PREFIX, '');
        input = input.replace(this.XML_SUFFIX, '');
        input = input.replaceAll(this.XML_RESET_COLOR_TAG, '');
        return input;
    }

    parseXMLTags(input: string) {
        const output = ['', ''];

        if (input.length > 0) {
            const rxTags = /<(.+?)\/?>/g

            let match = rxTags.exec(input);
            while (match !== null) {
                const tagData = this.parseXMLTag(match[1]);

                if (tagData) {
                    output[0] += tagData[0];
                    output[1] = tagData[1] + output[1];
                }

                match = rxTags.exec(input);
            }
        }

        return output;
    }

    parseJustification(input: string) {
        input = input.replace(/<JUST loc="(.+?)"\/>(.+?)(<JUST loc="left".?\/>|$)/g, '[$1]$2[/$1]');
        return input;
    }

    parseXMLTag(input: string) {
        input = input.replace('<', '');
        input = input.replace('/>', '');
        const split = input.split(' ');
        const type = split.shift();

        const ret = {};

        for (const value of split) {
            const kv = value.split('=');
            ret[kv[0]] = kv[1].slice(1, kv[1].length - 1);
        }

        if (typeof this['getBBFrom' + type] === 'function') {
            return this['getBBFrom' + type](ret);
        } else {
            console.error('can\'t parse ' + type);
            return false;
        }
    }

    getBBFromTRA(tra: any) {
        const bitmask = parseInt(tra.data.slice(8), 10);
        let color = tra.data.slice(2, 8);

        const startTags = [];
        const endTags = [];

        // tslint:disable-next-line:no-bitwise
        if (bitmask & 1) {
            startTags.push('[b]');
            endTags.push('[/b]');
        }

        // tslint:disable-next-line:no-bitwise
        if (bitmask & 2) {
            startTags.push('[i]');
            endTags.push('[/i]');
        }

        // tslint:disable-next-line:no-bitwise
        if (bitmask & 4) {
            startTags.push('[u]');
            endTags.push('[/u]');
        }

        if (color !== '000000') {
            // BGR to RGB
            color = color.split('').reverse().join('');

            startTags.push('[color=' + color + ']');
            endTags.push('[/color]');
        }

        return [ startTags.join(''), endTags.reverse().join('')];
    }

    getBBFromPARA(para: any) {
        return ['[br]', '']
    }

    getBBFromJUST(just: any) {
        return ['<JUST loc="' + just.loc + '"/>', ''];
    }
}
