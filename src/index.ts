import { Command, flags } from '@oclif/command'
import * as puppeteer from 'puppeteer';
import { watch } from 'fs';
const timeOut = (delay: number) => new Promise(resolve => setTimeout(resolve, delay));

class HotBrowseCli extends Command {
  static description = 'describe the command here'

  static flags = {
    version: flags.version({ char: 'v' }),
    help: flags.help({ char: 'h' }),
    url: flags.string({ required: true, char: 'u', description: 'URL for browse' }),
    watch: flags.string({ required: true, char: 'w', description: 'watching Directory or File for Hot Module Reload' }),
  }

  static args = [{ name: 'file' }]

  async run() {
    const { args, flags } = this.parse(HotBrowseCli)
    const watcher = watch(flags.watch || '', { persistent: true, recursive: true });

    const browser = await puppeteer.launch({ headless: false });
    browser.on('disconnected', () => watcher.close());
    const page = await browser.newPage();
    await page.setBypassCSP(false);
    await page.setCacheEnabled(false);
    await page.goto(flags.url || '');
    watcher.addListener('change', async () => {
      const sessionData = await page.evaluate(function () {
        const { captureSessionData } = window as any;
        return captureSessionData instanceof Function && captureSessionData();
      });
      await timeOut(500);
      await page.reload();
      await page.evaluate(function (sessionData) {
        const { loadCaptureSessionData } = window as any;
        if (loadCaptureSessionData instanceof Function)
          loadCaptureSessionData(sessionData);
      }, sessionData);
    });

  }
}

export = HotBrowseCli
