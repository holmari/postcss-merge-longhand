'use strict';

import postcss from 'postcss';
import hasAllProps from '../hasAllProps';
import canMerge from '../canMerge';
import minifyTrbl from '../minifyTrbl';
import parseTrbl from '../parseTrbl';
import getLastNode from '../getLastNode';
import mergeValues from '../mergeValues';
import valueType from '../type';
import clone from '../clone';

const trbl = ['top', 'right', 'bottom', 'left'];

export default {
	explode: (rule) => {
		rule.eachDecl('padding', decl => {
			let values = parseTrbl(decl.value);
			trbl.forEach((direction, index) => {
				let prop = clone(decl);
				prop.prop = `padding-${direction}`;
				prop.value = values[index];
				decl.parent.insertAfter(decl, prop);
			});
			decl.removeSelf();
		});
	},
	merge: (rule) => {
		let properties = trbl.map(direction => `padding-${direction}`);
		let decls = rule.nodes.filter(node => node.prop && ~properties.indexOf(node.prop));
		
		while (decls.length) {
			let lastNode = decls[decls.length - 1];
			let type = valueType(lastNode);
			let props = decls.filter(node => valueType(node) == type && node.important == lastNode.important);
			if (hasAllProps.apply(this, [props].concat(properties))) { 
				let rules = properties.map(prop => getLastNode(props, prop));
				let shorthand = clone(lastNode);
				shorthand.prop = 'padding';
				shorthand.value = minifyTrbl(mergeValues.apply(this, rules));
				rule.insertAfter(lastNode, shorthand);
				props.forEach(prop => prop.removeSelf());
			}
			decls = decls.filter(node => !~props.indexOf(node));
		}
		
		if (hasAllProps.apply(this, [rule].concat(properties))) {
			let rules = properties.map(p => getLastNode(rule.nodes, p));
			if (canMerge.apply(this, rules)) {
				rules.slice(0, 3).forEach(rule => rule.removeSelf());
				rules[3].value = minifyTrbl(mergeValues.apply(this, rules));
				rules[3].prop = 'padding';
			}
		}
	}
};