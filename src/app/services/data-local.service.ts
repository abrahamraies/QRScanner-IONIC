import { Injectable } from '@angular/core';
import { Registro } from '../models/registro.model';
import { Storage } from '@ionic/storage-angular';
import { NavController } from '@ionic/angular';
import { InAppBrowser } from '@awesome-cordova-plugins/in-app-browser/ngx';
import { File } from '@awesome-cordova-plugins/file/ngx';
import { EmailComposer } from '@awesome-cordova-plugins/email-composer/ngx';

@Injectable({
  providedIn: 'root'
})
export class DataLocalService {

  private _storage: Storage | null = null;
  registros: Registro[] = [];

  constructor(private storage: Storage,
              private navCtrl: NavController,
              private inAppBrowser: InAppBrowser,
              private file: File,
              private emailComposer: EmailComposer) {
    this.mantenerRegistros();
   }

  async mantenerRegistros(){
    const storage = await this.storage.create();
    this._storage = storage;
    this.cargarRegistros();
  }

  async cargarRegistros(){
    try{
      const regs = await this._storage.get('registros');
      this.registros = regs || [];
      return this.registros;
    }catch(error){

    }
  }

  guardarRegistro(format: string, text: string){
    const nuevoRegistro = new Registro( format, text);
    this.registros.unshift( nuevoRegistro);

    console.log(this.registros);
    this.storage.set('registros',this.registros);

    this.abrirRegistro(nuevoRegistro);
  }

  abrirRegistro(reg: Registro){
    this.navCtrl.navigateForward('/tabs/tab2');
    
    switch(reg.type){
      case 'http':
        this.inAppBrowser.create(reg.text,'_system');
      break;
      case 'geo':
        this.navCtrl.navigateForward(`/tabs/tab2/mapa/${reg.text}`);
      break;
    }
  }

  enviarCorreo(){
    const arrTemp = [];
    const titles = 'Tipo, Formato, Creado en, Texto\n';

    arrTemp.push(titles);
    
    this.registros.forEach( regs => {
      const linea = `${regs.type},${regs.format},${regs.created},${regs.text.replace(',',' ')}\n`;

      arrTemp.push(linea);
    });

    this.crearArchivoFisico(arrTemp.join(''));
  }

  crearArchivoFisico(text: string){
    this.file.checkFile(this.file.dataDirectory, 'registros.csv')
      .then( existe => {
        console.log('Existe archivo?', existe);
        return this.escribirEnArchivo(text);
      })
      .catch(error => {
        return this.file.createFile( this.file.dataDirectory, 'registros.csv',false)
          .then( created => this.escribirEnArchivo (text))
          .catch( err2 => console.log('No se pudo crear el archivo',err2));
      });
  }

  async escribirEnArchivo( text: string){
    await this.file.writeExistingFile( this.file.dataDirectory, 'registros.csv',text);

    console.log('Archivo creado');
    console.log(this.file.dataDirectory + 'registros.csv');
  }
}
