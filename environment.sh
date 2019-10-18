#!/bin/sh
echo "loading ./environment-local.env"
env $(cat "./environment-local.env" | xargs) $@
