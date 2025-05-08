import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProgramasDTO } from './programas.dto';
import { badResponse, baseResponse } from 'src/dto/base.dto';

@Injectable()
export class ProgramasService {

    constructor(private prismaService: PrismaService){

    }
/* */
    async getProgramas(){
        return await this.prismaService.programas.findMany({
            include: { PersonasProgramasMusica: {include:{persona:true}}}}
        )}

    async createProgramas(programa: ProgramasDTO){
        try{
           await this.prismaService.programas.create({
                data: {
                    
                    programa: programa.programa,
                    tipo_programa: programa.tipo_programa
                }
            })
                    baseResponse.message = 'exito al crear el programa.'
                    return baseResponse;
        }catch (error) {
                    badResponse.message = 'Error al crear el programa.' + error
                    return badResponse;
                }
    }

    async updateProgramas(id_programas: number, programas : ProgramasDTO ){
        try{
            await this.prismaService.programas.update({
                 data: {
                     
                     programa: programas.programa,
                     tipo_programa: programas.tipo_programa,
                 },
                 where: { id_programa: id_programas}
             });
                     baseResponse.message = 'exito al actualizar el programa.'
                     return baseResponse;
         }catch (error) {
                     badResponse.message = 'Error al actualizar el programa.' + error
                     return badResponse;
                 }
    }
    async deleteProgramas(id_programa: number) {
                try {
                    await this.prismaService.programas.update({
                        where: { id_programa: id_programa },
                        data: { eliminado : true }
                    });
    
    
                    baseResponse.message = 'persona eliminado exitosamente.'
                    return baseResponse;
                } catch (error) {
                    badResponse.message = 'Error al eliminar persona.' + error
                    return badResponse;
                }
            }

}