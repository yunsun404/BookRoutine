import { Controller, Get, Param, Request, Post, UseGuards } from '@nestjs/common';
import { StoreService } from './store.service';
import { JwtAuthGuard } from '../jwtAuth.guard';

@Controller('store')
export class StoreController {
    constructor(private readonly storeService: StoreService) { }

    @Get('list')
    async getStoreList() {
        return this.storeService.getStoreList();
    }

    @Get('items/:item_id')
    async getStoreItem(@Param('item_id') item_id: string) {
        return this.storeService.getStoreItem(item_id);
    }

    @UseGuards(JwtAuthGuard)
    @Post('items/:item_id/purchase')
    async purchaseItem(@Request() req, @Param('item_id') item_id: string) {
        return this.storeService.purchaseItem(req.user.sub, item_id,);
    }
}