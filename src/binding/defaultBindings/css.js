var classesWrittenByBindingKey = '__ko__cssValue';
ko.bindingHandlers['css'] = {
    'update': function (element, valueAccessor) {
        var classes = ko.utils.unwrapObservable(valueAccessor());
        var classString = [];

        if (!(classes instanceof Array)) classes = [ classes ];

        classes.forEach(function(clazz) {
            if (typeof clazz == 'object') {
                ko.utils.objectForEach(clazz, function(className, shouldHaveClass) {
                    ko.utils.toggleDomNodeCssClass(element, className, ko.unwrap(shouldHaveClass));
                });
            }
            else classString.push(String(clazz || '')); // Make sure we don't try to store or set a non-string value
        });

        if (classString.length > 0) {
            classString = classString.join(' ');
            ko.utils.toggleDomNodeCssClass(element, element[classesWrittenByBindingKey], false);
            element[classesWrittenByBindingKey] = classString;
            ko.utils.toggleDomNodeCssClass(element, classString, true);
        }
    }
};
