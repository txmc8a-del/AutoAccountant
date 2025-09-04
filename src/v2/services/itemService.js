import Item from '../models/Item.js';
import { logger } from '../utils/logger.js';

class ItemService {
  /**
   * Store a new Plaid item
   */
  async storeItem(accessToken, itemId, userId, institutionInfo = null) {
    try {
      const itemData = {
        access_token: accessToken,
        item_id: itemId,
        user_id: userId
      };

      if (institutionInfo) {
        itemData.institution_id = institutionInfo.institution_id;
        itemData.institution_name = institutionInfo.name;
      }

      const item = new Item(itemData);
      await item.save();

      logger.info(`Stored new Plaid item: ${itemId} for user: ${userId}`);
      return item;
    } catch (error) {
      logger.error('Failed to store Plaid item:', error);
      throw error;
    }
  }

  /**
   * Get items by user ID
   */
  async getItemsByUserId(userId) {
    try {
      const items = await Item.find({ user_id: userId, status: 'active' });
      return items;
    } catch (error) {
      logger.error('Failed to get items by user ID:', error);
      throw error;
    }
  }

  /**
   * Get item by access token
   */
  async getItemByAccessToken(accessToken) {
    try {
      const item = await Item.findOne({ access_token: accessToken });
      return item;
    } catch (error) {
      logger.error('Failed to get item by access token:', error);
      throw error;
    }
  }

  /**
   * Get item by item ID
   */
  async getItemByItemId(itemId) {
    try {
      const item = await Item.findOne({ item_id: itemId });
      return item;
    } catch (error) {
      logger.error('Failed to get item by item ID:', error);
      throw error;
    }
  }

  /**
   * Update item with account information
   */
  async updateItemAccounts(itemId, accounts) {
    try {
      const item = await Item.findOneAndUpdate(
        { item_id: itemId },
        { 
          accounts: accounts,
          updated_at: new Date()
        },
        { new: true }
      );
      
      logger.info(`Updated accounts for item: ${itemId}`);
      return item;
    } catch (error) {
      logger.error('Failed to update item accounts:', error);
      throw error;
    }
  }

  /**
   * Update item status
   */
  async updateItemStatus(itemId, status) {
    try {
      const item = await Item.findOneAndUpdate(
        { item_id: itemId },
        { 
          status: status,
          updated_at: new Date()
        },
        { new: true }
      );
      
      logger.info(`Updated status for item: ${itemId} to ${status}`);
      return item;
    } catch (error) {
      logger.error('Failed to update item status:', error);
      throw error;
    }
  }

  /**
   * Delete item
   */
  async deleteItem(itemId) {
    try {
      await Item.findOneAndDelete({ item_id: itemId });
      logger.info(`Deleted item: ${itemId}`);
    } catch (error) {
      logger.error('Failed to delete item:', error);
      throw error;
    }
  }

  /**
   * Check if item exists
   */
  async itemExists(itemId) {
    try {
      const item = await Item.findOne({ item_id: itemId });
      return !!item;
    } catch (error) {
      logger.error('Failed to check if item exists:', error);
      throw error;
    }
  }

  /**
   * Get all items (for admin purposes)
   */
  async getAllItems() {
    try {
      const items = await Item.find({}).sort({ created_at: -1 });
      return items;
    } catch (error) {
      logger.error('Failed to get all items:', error);
      throw error;
    }
  }
}

export default new ItemService();
