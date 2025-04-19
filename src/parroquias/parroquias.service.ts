import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ParroquiasDTO } from './parroquias.dto';
import { Parroquias } from '@prisma/client';

@Injectable()
export class ParroquiasService {

    constructor(private prismaService: PrismaService){

    }

    async getParroquia(){
        return await this.prismaService.parroquias.findMany();
    }

    async createParroquia(parroquia: ParroquiasDTO){
        try{
            await this.prismaService.parroquias.create({
                data: { 
                    parroquia: parroquia.parroquias,
                    id_ciudad: parroquia.id_ciudad
                 }
             })
            return {message: 'Parroquia creada exitosamente. '}

        }catch (error) {return {message: 'Error al ingresar la parroquia. '+ error }}
    }

    async updateParroquia(id_parroquia: number, parroquia: ParroquiasDTO){
       try{
        await this.prismaService.parroquias.update({
            data: {
                parroquia: parroquia.parroquias
            },
            where: {
                id_parroquia: id_parroquia
            }
            })
            return {message: 'Parroquia Actualizada exitosamente. '}

        }catch (error) {return {message: 'Error al actualizar la parroquia. '+ error }}
    }

    async deleteParroquia(id_parroquia:number) {
        try{
        await this.prismaService.parroquias.delete({
            where: {
                id_parroquia: id_parroquia
            }
            })
        return{ message: 'Parroquia Eliminada exitosamente. '}

    }catch (error) {return {message: 'Error al eliminar la parroquia. '+ error }}
    }
}
