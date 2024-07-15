#!/bin/su root

journalctl -u traileyes-staging -f --output cat -n 100
