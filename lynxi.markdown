---
layout: lynxi
permalink: /lynxi/
title: Links
---
<div class="user-head">
    <a class="page-link" href="/index">
        <img src="https://d15mvavv27jnvy.cloudfront.net/69Rmo/6eeeb6084cf2dec200686d1ff3ec5206.jpg"
        width="90" height="90" class="img-profile">
        <h2>@shaunnope</h2>
    </a>
</div>
<div class="links">
{% for link in site.lynxi %}
    <a class="page-link btn-lynxi" href="{{ link.url }}" title="{{ link.title }}" target="_blank">{{ link.text }}</a>
{% endfor %}
</div>
