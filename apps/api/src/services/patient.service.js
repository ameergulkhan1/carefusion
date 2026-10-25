const Patient = require('../models/Patient.model');
const MedicalRecord = require('../models/MedicalRecord.model');
const User = require('../models/User');

class PatientService {
  /**
   * Get patient profile with user data
   */
  async getPatientProfile(userId) {
    try {
      const user = await User.findById(userId).select('-password -refreshToken');
      if (!user) {
        throw new Error('User not found');
      }

      let patient = await Patient.findOne({ user: userId });
      
      // If patient doesn't exist, create one
      if (!patient) {
        patient = await Patient.create({ user: userId });
      }

      return {
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          profileImage: user.profileImage,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          isPhoneVerified: user.isPhoneVerified
        },
        patient: patient.fullProfile
      };
    } catch (error) {
      throw new Error(`Failed to get patient profile: ${error.message}`);
    }
  }

  /**
   * Update patient profile
   */
  async updatePatientProfile(userId, updateData) {
    try {
      const { user: userData, patient: patientData } = updateData;
      
      const updated = {};

      // Update User data
      if (userData) {
        const allowedUserFields = ['fullName', 'phone', 'profileImage'];
        const userUpdateData = {};
        
        allowedUserFields.forEach(field => {
          if (userData[field] !== undefined) {
            userUpdateData[field] = userData[field];
          }
        });

        if (Object.keys(userUpdateData).length > 0) {
          const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: userUpdateData },
            { new: true, runValidators: true }
          ).select('-password -refreshToken');
          
          updated.user = updatedUser;
        }
      }

      // Update Patient data
      if (patientData) {
        const patient = await Patient.findOne({ user: userId });
        
        if (!patient) {
          throw new Error('Patient record not found');
        }

        // Update simple fields
        const simpleFields = ['dateOfBirth', 'gender', 'bloodGroup'];
        simpleFields.forEach(field => {
          if (patientData[field] !== undefined) {
            patient[field] = patientData[field];
          }
        });

        // Update nested objects
        if (patientData.address) {
          patient.address = { ...patient.address, ...patientData.address };
        }

        if (patientData.emergencyContact) {
          patient.emergencyContact = { ...patient.emergencyContact, ...patientData.emergencyContact };
        }

        if (patientData.insurance) {
          patient.insurance = { ...patient.insurance, ...patientData.insurance };
        }

        await patient.save();
        updated.patient = patient;
      }

      // Return updated profile
      return await this.getPatientProfile(userId);
    } catch (error) {
      throw new Error(`Failed to update patient profile: ${error.message}`);
    }
  }

  /**
   * Add medical history entry
   */
  async addMedicalHistory(userId, entryData) {
    try {
      const patient = await Patient.findOne({ user: userId });
      
      if (!patient) {
        throw new Error('Patient record not found');
      }

      const newEntry = {
        ...entryData,
        addedBy: userId,
        addedAt: new Date()
      };

      patient.medicalHistory.push(newEntry);
      await patient.save();

      return patient.medicalHistory[patient.medicalHistory.length - 1];
    } catch (error) {
      throw new Error(`Failed to add medical history: ${error.message}`);
    }
  }

  /**
   * Update medical history entry
   */
  async updateMedicalHistory(userId, entryId, updateData) {
    try {
      const patient = await Patient.findOne({ user: userId });
      
      if (!patient) {
        throw new Error('Patient record not found');
      }

      const entry = patient.medicalHistory.id(entryId);
      
      if (!entry) {
        throw new Error('Medical history entry not found');
      }

      // Update entry fields
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          entry[key] = updateData[key];
        }
      });

      await patient.save();

      return entry;
    } catch (error) {
      throw new Error(`Failed to update medical history: ${error.message}`);
    }
  }

  /**
   * Delete medical history entry
   */
  async deleteMedicalHistory(userId, entryId) {
    try {
      const patient = await Patient.findOne({ user: userId });
      
      if (!patient) {
        throw new Error('Patient record not found');
      }

      patient.medicalHistory.pull(entryId);
      await patient.save();

      return { message: 'Medical history entry deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete medical history: ${error.message}`);
    }
  }

  /**
   * Get medical history
   */
  async getMedicalHistory(userId, filters = {}) {
    try {
      const patient = await Patient.findOne({ user: userId }).populate('medicalHistory.addedBy', 'fullName role');
      
      if (!patient) {
        throw new Error('Patient record not found');
      }

      let history = patient.medicalHistory;

      // Apply filters
      if (filters.eventType) {
        history = history.filter(entry => entry.eventType === filters.eventType);
      }

      if (filters.status) {
        history = history.filter(entry => entry.status === filters.status);
      }

      if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        history = history.filter(entry => entry.diagnosedDate >= startDate);
      }

      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        history = history.filter(entry => entry.diagnosedDate <= endDate);
      }

      // Sort by date (newest first)
      history.sort((a, b) => b.diagnosedDate - a.diagnosedDate);

      return {
        medicalHistory: history,
        chronicConditions: patient.chronicConditions,
        allergies: patient.allergies,
        surgeries: patient.surgeries,
        vaccinations: patient.vaccinations
      };
    } catch (error) {
      throw new Error(`Failed to get medical history: ${error.message}`);
    }
  }

  /**
   * Add chronic condition
   */
  async addChronicCondition(userId, conditionData) {
    try {
      const patient = await Patient.findOne({ user: userId });
      
      if (!patient) {
        throw new Error('Patient record not found');
      }

      patient.chronicConditions.push(conditionData);
      await patient.save();

      return patient.chronicConditions[patient.chronicConditions.length - 1];
    } catch (error) {
      throw new Error(`Failed to add chronic condition: ${error.message}`);
    }
  }

  /**
   * Add allergy
   */
  async addAllergy(userId, allergyData) {
    try {
      const patient = await Patient.findOne({ user: userId });
      
      if (!patient) {
        throw new Error('Patient record not found');
      }

      patient.allergies.push(allergyData);
      await patient.save();

      return patient.allergies[patient.allergies.length - 1];
    } catch (error) {
      throw new Error(`Failed to add allergy: ${error.message}`);
    }
  }

  /**
   * Add surgery
   */
  async addSurgery(userId, surgeryData) {
    try {
      const patient = await Patient.findOne({ user: userId });
      
      if (!patient) {
        throw new Error('Patient record not found');
      }

      patient.surgeries.push(surgeryData);
      await patient.save();

      return patient.surgeries[patient.surgeries.length - 1];
    } catch (error) {
      throw new Error(`Failed to add surgery: ${error.message}`);
    }
  }

  /**
   * Add vaccination
   */
  async addVaccination(userId, vaccinationData) {
    try {
      const patient = await Patient.findOne({ user: userId });
      
      if (!patient) {
        throw new Error('Patient record not found');
      }

      patient.vaccinations.push(vaccinationData);
      await patient.save();

      return patient.vaccinations[patient.vaccinations.length - 1];
    } catch (error) {
      throw new Error(`Failed to add vaccination: ${error.message}`);
    }
  }

  /**
   * Get patient statistics
   */
  async getPatientStats(userId) {
    try {
      const patient = await Patient.findOne({ user: userId });
      
      if (!patient) {
        throw new Error('Patient record not found');
      }

      await patient.updateStats();

      return patient.stats;
    } catch (error) {
      throw new Error(`Failed to get patient stats: ${error.message}`);
    }
  }

  /**
   * Create medicine order
   */
  async createMedicineOrder(userId, orderData) {
    try {
      const MedicineOrder = require('../models/MedicineOrder');
      const Patient = require('../models/Patient.model');
      const Medicine = require('../models/Medicine');
      const Pharmacy = require('../models/Pharmacy');
      
      // Find patient
      const patient = await Patient.findOne({ user: userId });
      if (!patient) {
        const error = new Error('Patient profile not found');
        error.statusCode = 404;
        throw error;
      }

      if (!orderData.pharmacyId) {
        const error = new Error('pharmacyId is required');
        error.statusCode = 400;
        throw error;
      }

      const pharmacy = await Pharmacy.findById(orderData.pharmacyId);
      if (!pharmacy) {
        const error = new Error('Selected pharmacy not found');
        error.statusCode = 404;
        throw error;
      }

      // Calculate totals
      const items = [];
      let subtotal = 0;

      for (const item of orderData.items) {
        // Find medicine by ID or create placeholder
        let medicine = null;
        if (item.medicineId && item.medicineId.match(/^[0-9a-fA-F]{24}$/)) {
          medicine = await Medicine.findById(item.medicineId);
        }

        const itemPrice = parseFloat(item.price) || 0;
        const itemQuantity = parseInt(item.quantity) || 1;
        const itemSubtotal = itemPrice * itemQuantity;

        const inventoryItem = pharmacy.inventory.find(
          (inv) => String(inv.medicineId) === String(medicine?._id || item.medicineId)
        );

        if (!inventoryItem) {
          const error = new Error(`Medicine not available in selected pharmacy: ${item.medicineName || item.medicineId}`);
          error.statusCode = 400;
          throw error;
        }

        if ((inventoryItem.stock || 0) < itemQuantity) {
          const error = new Error(`Insufficient stock for ${item.medicineName || medicine?.name}`);
          error.statusCode = 400;
          throw error;
        }

        items.push({
          medicine: medicine?._id,
          name: item.medicineName || medicine?.name || 'Unknown Medicine',
          quantity: itemQuantity,
          price: itemPrice,
          subtotal: itemSubtotal
        });

        subtotal += itemSubtotal;
      }

      // Reserve stock immediately for accepted order
      for (const item of items) {
        const inventoryItem = pharmacy.inventory.find(
          (inv) => String(inv.medicineId) === String(item.medicine)
        );

        if (inventoryItem) {
          inventoryItem.stock = Math.max(0, (inventoryItem.stock || 0) - item.quantity);
        }
      }

      await pharmacy.save();

      const deliveryCharge = parseFloat(orderData.deliveryCharge) || 0;
      const discount = parseFloat(orderData.discount) || 0;
      const total = subtotal + deliveryCharge - discount;

      // Generate order number
      const orderNumber = `MO${Date.now()}${Math.floor(Math.random() * 1000)}`;

      // Create order
      const order = await MedicineOrder.create({
        orderNumber,
        patient: patient._id,
        pharmacy: pharmacy._id,
        items,
        subtotal,
        deliveryCharge,
        discount,
        total,
        deliveryAddress: {
          street: orderData.deliveryAddress.street,
          city: orderData.deliveryAddress.city,
          state: orderData.deliveryAddress.state,
          zipCode: orderData.deliveryAddress.zipCode,
          country: orderData.deliveryAddress.country || 'India'
        },
        contactPhone: orderData.deliveryAddress.phone,
        paymentMethod: orderData.paymentMethod || 'cash',
        paymentStatus: 'pending',
        status: 'pending',
        notes: orderData.notes
      });

      order.statusHistory.push({
        status: 'pending',
        note: 'Order placed by patient',
        updatedBy: userId,
        timestamp: new Date()
      });

      await order.save();

      return order;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get medicine orders for patient
   */
  async getMedicineOrders(userId, filters = {}) {
    try {
      const MedicineOrder = require('../models/MedicineOrder');
      const Patient = require('../models/Patient.model');
      
      const patient = await Patient.findOne({ user: userId });
      if (!patient) {
        throw new Error('Patient profile not found');
      }

      const query = { patient: patient._id };

      // Add filters
      if (filters.status) {
        query.status = filters.status;
      }

      if (filters.paymentStatus) {
        query.paymentStatus = filters.paymentStatus;
      }

      const page = parseInt(filters.page) || 1;
      const limit = parseInt(filters.limit) || 10;
      const skip = (page - 1) * limit;

      const orders = await MedicineOrder.find(query)
        .populate('pharmacy', 'pharmacyName contactNumber')
        .populate('items.medicine', 'name genericName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await MedicineOrder.countDocuments(query);

      return {
        orders,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit
        }
      };
    } catch (error) {
      throw new Error(`Failed to get medicine orders: ${error.message}`);
    }
  }

  /**
   * Get medicine order by ID
   */
  async getMedicineOrderById(userId, orderId) {
    try {
      const MedicineOrder = require('../models/MedicineOrder');
      const Patient = require('../models/Patient.model');
      
      const patient = await Patient.findOne({ user: userId });
      if (!patient) {
        const error = new Error('Patient profile not found');
        error.statusCode = 404;
        throw error;
      }

      const order = await MedicineOrder.findOne({
        _id: orderId,
        patient: patient._id
      })
        .populate('pharmacy', 'pharmacyName contactNumber email address')
        .populate('items.medicine', 'name genericName manufacturer');

      if (!order) {
        const error = new Error('Order not found');
        error.statusCode = 404;
        throw error;
      }

      return order;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cancel medicine order
   */
  async cancelMedicineOrder(userId, orderId, reason) {
    try {
      const MedicineOrder = require('../models/MedicineOrder');
      const Patient = require('../models/Patient.model');
      
      const patient = await Patient.findOne({ user: userId });
      if (!patient) {
        const error = new Error('Patient profile not found');
        error.statusCode = 404;
        throw error;
      }

      const order = await MedicineOrder.findOne({
        _id: orderId,
        patient: patient._id
      });

      if (!order) {
        const error = new Error('Order not found');
        error.statusCode = 404;
        throw error;
      }

      // Check if order can be cancelled
      if (['delivered', 'cancelled'].includes(order.status)) {
        const error = new Error(`Cannot cancel order with status: ${order.status}`);
        error.statusCode = 400;
        throw error;
      }

      // Restore reserved stock when cancelling
      const Pharmacy = require('../models/Pharmacy');
      const pharmacy = await Pharmacy.findById(order.pharmacy);
      if (pharmacy) {
        (order.items || []).forEach((orderItem) => {
          const inventoryItem = pharmacy.inventory.find(
            (inv) => String(inv.medicineId) === String(orderItem.medicine)
          );
          if (inventoryItem) {
            inventoryItem.stock = (inventoryItem.stock || 0) + (orderItem.quantity || 0);
          }
        });
        await pharmacy.save();
      }

      order.status = 'cancelled';
      order.notes = reason ? `${order.notes || ''}\nCancellation reason: ${reason}` : order.notes;
      order.statusHistory.push({
        status: 'cancelled',
        note: reason || 'Cancelled by patient',
        updatedBy: userId,
        timestamp: new Date()
      });
      await order.save();

      return order;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new PatientService();
