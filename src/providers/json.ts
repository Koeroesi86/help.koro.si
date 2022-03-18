import path from 'path';
import {
  Access,
  AccessFilters,
  Location,
  LocationResource,
  LocationsFilters,
  Need,
  NeedResource,
  NeedsFilters,
  Organisation,
  OrganisationResource,
  Provider,
  TranslationsResource,
} from "../types";
import * as translations from "./translations";
import JsonResource from "./jsonResource";
import translate from "./translate";

export default class JsonProvider implements Provider {
  private readonly basePath: string;
  private readonly locationResources: JsonResource<LocationResource>;
  private readonly needResources: JsonResource<NeedResource>;
  private readonly organisationResources: JsonResource<OrganisationResource>;
  private accessResources: JsonResource<Access>;
  private translationResources: JsonResource<TranslationsResource>;

  constructor(props: { basePath: string }) {
    this.basePath = props.basePath;

    const needResourcesPath = path.resolve(this.basePath, './need/');
    const locationResourcesPath = path.resolve(this.basePath, './location/');
    const organisationResourcesPath = path.resolve(this.basePath, './organisation/');
    const accessResourcesPath = path.resolve(this.basePath, './access/');
    const translationResourcesPath = path.resolve(this.basePath, './translation/');

    this.needResources = new JsonResource<NeedResource>(needResourcesPath);
    this.locationResources = new JsonResource<LocationResource>(locationResourcesPath);
    this.organisationResources = new JsonResource<OrganisationResource>(organisationResourcesPath);
    this.accessResources = new JsonResource<Access>(accessResourcesPath);
    this.translationResources = new JsonResource<TranslationsResource>(translationResourcesPath);
  }

  getLocation = async (id: string, language?: string): Promise<LocationResource | undefined> => {
    const location = await this.locationResources.one(id);

    if (!location) {
      return undefined;
    }

    return location;
  };

  getLocations = async (filters?: LocationsFilters): Promise<LocationResource[]> => {
    const ids = await this.locationResources.getIds();
    const allLocations = await Promise.all(
      ids.map(async (id) => this.getLocation(id))
    );

    return allLocations
      .filter(Boolean)
      .filter(l => filters && filters.organisationId ? l.organisationId === filters.organisationId : true);
  };

  getNeed = async (id: string, language?: string): Promise<Need | undefined> => {
    return this.needResources.one(id).then(async (n) => ({
      ...n,
      name: language ? await translate(n.name, language) : n.name,
      originalName: n.name,
    }));
  };

  getNeeds = async (filters?: NeedsFilters, language?: string): Promise<Need[]> => {
    let allNeeds: Need[] = (await this.needResources.all()).map((n) => ({ ...n, originalName: n.name }));

    if (language) {
      allNeeds = await Promise.all(allNeeds.map(async (need) => ({
        ...need,
        name: await translate(need.name, language),
        originalName: need.name,
      })));
    }

    return allNeeds
      .filter(n => filters && filters.search ? n.name.includes(filters.search) : true)
      .filter(n => filters && filters.locationId ? n.locationId === filters.locationId : true);
  };

  getOrganisation = async (id: string): Promise<OrganisationResource | undefined> => {
    const organisation = await this.organisationResources.one(id);

    if (!organisation) {
      return undefined;
    }

    return organisation;
  };

  getOrganisations = async (): Promise<OrganisationResource[]> => {
    const ids = await this.organisationResources.getIds();
    const result = await Promise.all(
      ids.map(async (id) => this.getOrganisation(id))
    );
    return result.filter(Boolean);
  };

  getTranslation = async (code: string): Promise<TranslationsResource> => {
    const translation = await this.translationResources.one(code);

    if (!translation) {
      return {
        id: 'en',
        translations: translations.en,
      };
    }

    return {
      ...translation,
      translations: {
        ...translations.en,
        ...translation.translations,
      },
    };
  };

  getTranslations = (): Promise<TranslationsResource[]> => {
    return this.translationResources.all();
  }

  setTranslations = async (translations: TranslationsResource): Promise<void> => {
    await this.translationResources.set(translations);
  };

  removeLocation = async (id: string): Promise<void> => {
    const location = await this.getLocation(id);

    if (!location) {
      return;
    }

    const needs = await this.getNeeds({ locationId: id });
    await Promise.all(needs.map((async (need) => this.removeNeed(need.id))));
    await this.locationResources.remove(id);
  };

  removeNeed = async (id: string): Promise<void> => {
    await this.needResources.remove(id);
  };

  removeOrganisation = async (id: string): Promise<void> => {
    const organisation = await this.getOrganisation(id);

    if (!organisation) {
      return;
    }

    const locations = await this.getLocations({ organisationId: id });
    await Promise.all(locations.map((async (location) => this.removeLocation(location.id))));
    await this.organisationResources.remove(id);
  };

  setLocation = async (location: LocationResource): Promise<void> => {
    await this.locationResources.set(location);
  };

  setNeed = async (need: NeedResource): Promise<void> => {
    await this.needResources.set(need);
  };

  setOrganisation = async (organisation: OrganisationResource): Promise<void> => {
    await this.organisationResources.set(organisation);
  };

  getAccesses = async (filters?: AccessFilters): Promise<Access[]> => {
    const results = await this.accessResources.all();
    return results
      .filter((access) => filters && filters.code ? access.code === filters.code : true);
  };

  getAccess = async (id: string): Promise<Access | undefined> => {
    return this.accessResources.one(id);
  };

  setAccess = async (access: Access): Promise<void> => {
    await this.accessResources.set(access);
  };

  removeAccess = async (id: string): Promise<void> => {
    await this.accessResources.remove(id);
  };

}