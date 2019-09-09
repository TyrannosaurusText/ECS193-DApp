const settings = require('electron-settings');

var links = document.querySelectorAll('link[rel="import"]');

Array.prototype.forEach.call(links, function(link) {
    var template = link.import.querySelector('.task-template-landing');
    if (template != null)
    {
        var clone = document.importNode(template.content, true);
        document.querySelector('.content').appendChild(clone);
    }
});

function loadImports ()
{
    var accType = settings.get('accType');
    var contentDiv = document.getElementById('content');
    var navDiv = document.getElementById('nav-button-holder');
    contentDiv.innerHTML = '';
    navDiv.innerHTML = '<button type="button" id="button-landing" data-section="landing" class="nav-button is-selected">Landing</button>';

    Array.prototype.forEach.call(links, function(link) {
        var template = link.import.querySelector('.task-template-landing');
        if (template != null)
        {
            var clone = document.importNode(template.content, true);
            document.querySelector('.content').appendChild(clone);
        }
    });

    if (accType == 'admin' || accType == 'adminDoctor')
    {
        Array.prototype.forEach.call(links, function(link) {
            var template = link.import.querySelector('.task-template-admin');
            if (template == null)
                template = link.import.querySelector('.task-template-admin');
            if (template != null)
            {
                var btn = document.createElement('button');
                btn.type = 'button';
                btn.classList.add('nav-button');
                btn.id = 'button-' + link.dataset.section;
                btn.dataset['section'] = link.dataset.section;
                btn.innerHTML = link.dataset.label;
                navDiv.appendChild(btn);

                var clone = document.importNode(template.content, true);
                document.querySelector('.content').appendChild(clone);
            }
        });
    }
    if (accType == 'doctor')
    {
        Array.prototype.forEach.call(links, function(link) {
            var template = link.import.querySelector('.task-template-doctor');
            if (template != null)
            {
                var btn = document.createElement('button');
                btn.type = 'button';
                btn.classList.add('nav-button');
                btn.id = 'button-' + link.dataset.section;
                btn.dataset['section'] = link.dataset.section;
                btn.innerHTML = link.dataset.label;
                navDiv.appendChild(btn);

                var clone = document.importNode(template.content, true);
                document.querySelector('.content').appendChild(clone);
            }
        });
    }
}

module.exports.loadImports = loadImports;