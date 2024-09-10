---
layout: page
title: About
permalink: /about/
---
{% include intro.md %}

## Experience
{%- assign items = site.records | where: 'cat', "experience" | sort: "startDate" | reverse -%}
{% for expr in items  %}
  {% include card.html expr=expr %}
{% endfor %}

## Education
{%- assign items = site.records | where: 'cat', "education" | sort: "startDate" | reverse -%}
{% for expr in items  %}
  {% include card.html expr=expr %}
{% endfor %}

## Projects
{%- assign items = site.records | where: 'cat', "projects" | sort: "startDate" | reverse -%}
{% for expr in items  %}
  {% include card.html expr=expr %}
{% endfor %}

## Personal
I enjoy learning new languages, natural and constructed alike. Fluent in English and Mandarin, I am currently learning Japanese, Esperanto, and Rust. I also enjoy various forms of sports, including badminton, bouldering, and swimming.
